define(function(require, exports, module) {
  var Utilities = require('famous-cassowary/Utilities');
  var Cassowary = require('famous-cassowary/Cassowary');

  /*
   * CassowaryBuilder
   *
   * Factory base object to create Cassowary-related objects such as
   * variables, expressions and constraints. The idea is to provide
   * a static interface that other modules can use to construct their
   * own internals.
   *
   * This module does most of the heavy lifting in this project. As a
   * direct result of that, the code is the gnarliest. If you're looking
   * for a contribution to make, feel free to look for 'TODO' or 'fixme'
   * comments which I've added on a couple of problems.
   *
   * Broadly speaking, this module is responsible for...
   *
   *   * Figuring out how to convert the options object properties (which
   *     we're using as a kind of poor-man's-DSL) into the actual Cassowary
   *     library objects.
   *
   *   * Assembling those Cassowary objects in the correct way such that
   *     a SimplexSolver can compute over them and come to resolution.
   *
   * More specifically, it can do four things:
   *   1. Convert a 'variables' object into Cassowary variables.
   *      E.g.: { thing: 123 } ~~> Cassowary.Variable(...)
   *
   *   2. Convert an 'expression' construct into a Cassowary expression.
   *      E.g. ['thing1', '+', 'thing2'] ~~> Cassowary.Expression(...)
   *
   *   3. Convert a 'constraint' construct into a Cassowary constraint.
   *      E.g. ['thing1', '<=', 200] ~~> Cassowary.Inequality(...)
   *
   *   4. Create reactive functions from any variable objects that were
   *      supplied as functions, and ensure that each time those functions
   *      are run they trigger the solver's 'suggestValue' method, so
   *      that all the values get recalculated.
   *
  */
  var CassowaryBuilder = {};

  var KEY_ADD      = '+',
      KEY_SUBTRACT = '-',
      KEY_MULTIPLY = '*',
      KEY_DIVIDE   = '/',
      KEY_GT       = '>', // Not supported by the solver yet.
      KEY_LT       = '<', // Not supported by the solver yet.
      KEY_GTE      = '>=',
      KEY_LTE      = '<=',
      KEY_EQ       = '=',
      KEY_WEAK     = 'weak',
      KEY_MEDIUM   = 'medium',
      KEY_STRONG   = 'strong',
      KEY_REQ      = 'required';

  var OPERATORS = [KEY_ADD, KEY_SUBTRACT, KEY_MULTIPLY, KEY_DIVIDE];
  var COMPARATORS = [KEY_GTE, KEY_LTE, KEY_EQ];
  var STRENGTHS = [KEY_WEAK, KEY_MEDIUM, KEY_STRONG, KEY_REQ];

  function isOperator(thing) {
    return Utilities.doesInclude(OPERATORS, thing);
  }

  function isComparator(thing) {
    return Utilities.doesInclude(COMPARATORS, thing);
  }

  function isStrength(thing) {
    return Utilities.doesInclude(STRENGTHS, thing);
  }

  function isCassowaryExpression(thing) {
    return thing instanceof Cassowary.Expression;
  }

  function isCassowaryVariable(thing) {
    return thing instanceof Cassowary.AbstractVariable;
  }



  // Convert an object of variables into an object with Cassowary
  // variables. Ignore any properties that aren't going to work.
  CassowaryBuilder.buildVariables = function(variables, simplexSolver) {
    var builtVariables = {};

    Utilities.eachProperty(variables, function(varVal, varName) {
      if (Utilities.isNumber(varVal)) {
        builtVariables[varName] = new Cassowary.Variable({ value: varVal, name: varName });
      } else if (isCassowaryVariable(varVal)) {
        // The user may want to create their own Cassowary variable instance.
        varVal.name = varName;
        builtVariables[varName] = varVal;
      } else if (Utilities.isNumber(varVal.value)) {
        // If they sent an object with a value property like { value: 123 }...
        builtVariables[varName] = new Cassowary.Variable(varVal);
        builtVariables[varName].name = varName;
      } else if (Utilities.isFunction(varVal)) {
        // Execute the function initially to get a starting value:
        builtVariables[varName] = new Cassowary.Variable({ name: varName, value: varVal() });
        // Assign a 'reactiveFunction' that can dynamically change the variable's value.
        builtVariables[varName].reactiveFunction = varVal;
      }
    });

    // Assume that all 'variables' are supposed to be edit variables in the system.
    if (simplexSolver) {
      Utilities.eachProperty(builtVariables, function(variable) {
        simplexSolver.addEditVar(variable);
      });
    }

    return builtVariables;
  };



  // Take an object whose property names are expression names and
  // whose values are arrays that represent a group expression, and convert
  // them into Cassowary expressions.
  CassowaryBuilder.buildExpressions = function(builtVariables, expressions) {
    var builtExpressions = {};
    var atomicExpressions = CassowaryBuilder.findAtomicExpressions(expressions);
    Utilities.eachProperty(atomicExpressions, function(exprValue, exprName) {
      if (Utilities.isNumber(exprValue)) {
        builtExpressions[exprName] = CassowaryBuilder.buildCassowaryConstantExpression(exprValue);
      } else if (Utilities.isString(exprValue)) {
        // Assume a string is meant to reference an already-defined variable.
        if (builtVariables[exprName]) {
          builtExpressions[exprName] = CassowaryBuilder.buildCassowaryVariableExpression(
            builtVariables[exprName]
          );
        }
      } else if (isCassowaryExpression(exprValue)) {
        builtExpressions[exprName] = exprValue;
      }
    });

    var groupExpressions = CassowaryBuilder.findGroupExpressions(expressions);
    var groupExpressionsOrdered = CassowaryBuilder.orderGroupExpressions(groupExpressions, builtExpressions);
    for (var i = 0, len = groupExpressionsOrdered.length; i < len; i++) {
      var groupExpressionWrapper = groupExpressionsOrdered[i];
      var groupExpressionName = groupExpressionWrapper.name;
      var groupExpression = groupExpressionWrapper.expression;
      builtExpressions[groupExpressionName] = CassowaryBuilder.composeCassowaryExpression(
        groupExpressionName,
        groupExpression,
        builtExpressions,
        builtVariables
      );
    }

    return builtExpressions;
  };

  // Take several arguments and compose them into a full Cassowary
  // expression, including operators and comparators.
  // TODO/fixme. This whole method is a mess.
  CassowaryBuilder.composeCassowaryExpression = function(expressionGroupName, expressionGroup, alreadyBuiltExpressions, alreadyBuiltVariables) {
    var expressionPieces = [];

    // Need reference to the Cassowary library's operator functions.
    var AbstractCassowaryExpression = new Cassowary.Expression();

    // Create a correct object for every member of the expression group.
    for (var i = 0, len = expressionGroup.length; i < len; i++) {
      var exprPart = expressionGroup[i];
      var lastPart = Utilities.last(expressionPieces);

      if (Utilities.isNumber(exprPart)) {

        // We've got a "primitive" value. Wrap it as a single-val expression.
        expressionPieces.push(
          CassowaryBuilder.buildCassowaryConstantExpression(exprPart)
        );

      } else if (Utilities.isString(exprPart)) {
        // A string might be an operator or a reference.
        if (isOperator(exprPart)) {

          if (lastPart) {
            if (isCassowaryExpression(lastPart)) {
              // Return functions that we will be composing together below.
              if (exprPart === KEY_ADD) {
                expressionPieces.push('plus');
              } else if (exprPart === KEY_SUBTRACT) {
                expressionPieces.push('minus');
              } else if (exprPart === KEY_MULTIPLY) {
                expressionPieces.push('times');
              } else if (exprPart === KEY_DIVIDE) {
                expressionPieces.push('divide');
              }
            } else {
              throw "Operator '" + exprPart + "' must be preceded by a Cassowary expression!";
            }
          } else {
            throw "Operator cannot be preceded by a null!";
          }

        } else {

          // Any other string should be a reference to an already-built expression or variable.
          if (alreadyBuiltExpressions[exprPart]) {
            expressionPieces.push(alreadyBuiltExpressions[exprPart]);

          } else if (alreadyBuiltVariables[exprPart]) {

            // If a variable, remember to wrap it in an expression so we can do math on it.
            var newExpr = CassowaryBuilder.buildCassowaryVariableExpression(
              alreadyBuiltVariables[exprPart]
            )

            // Add the expression to the variable so it can be referenced elsewhere.
            alreadyBuiltVariables[exprPart].parentExpression = newExpr;

            expressionPieces.push(newExpr);
          }

        }
      } else if (Utilities.isArray(exprPart) && exprPart.length > 0) {

        // If this is an array, then it's a sub-expression. Recurse.
        expressionPieces.push(
          CassowaryBuilder.composeCassowaryExpression(
            expressionGroupName,
            exprPart,
            alreadyBuiltExpressions
          )
        );

      }
    }

    while (expressionPieces.length > 1) {
      var piece = expressionPieces.shift();
      if (isCassowaryExpression(piece)) {
        var operatorString = expressionPieces.shift();
        var nextExpression = expressionPieces.shift();
        expressionPieces.unshift(piece[operatorString](nextExpression));
      }
    }

    var composedExpression = expressionPieces.shift();

    return composedExpression;
  };

  // Take a value and create a Cassowary constant expression with it.
  CassowaryBuilder.buildCassowaryConstantExpression = function(constant) {
    return Cassowary.Expression.fromConstant(constant);
  };

  // Take a value and create a Cassowary variable expression with it.
  CassowaryBuilder.buildCassowaryVariableExpression = function(variable) {
    return Cassowary.Expression.fromVariable(variable);
  };

  // Take an object containing group expression descriptors, and an optional
  // argument with previously built atomic expressions, and set them in the order such
  // that dependencies occur in the correct order.
  CassowaryBuilder.orderGroupExpressions = function(groupExpressions, builtAtomicExpressions) {
    var orderedGroupExpressions = []; // Output object.
    var orderedGroupExpressionNames = [];
    var alreadyDefinedNames = [];

    // Create a list of the expression names we've already defined. They are
    // already ahead of everything else in the dependency graph.
    if (builtAtomicExpressions && builtAtomicExpressions.length) {
      Utilities.eachProperty(builtAtomicExpressions, function(builtExpr, builtExprName) {
        alreadyDefinedNames.push(builtExprName);
      });
    }

    // Loop over all of the group expressions, and build a list of names we need
    // to define *before* defining the current one in order for things to work.
    Utilities.eachProperty(groupExpressions, function(exprGroup, exprName) {
      // First, get a list of all names referenced inside this group.
      var namesReferencedInThisGroup = [];
      for (var i = 0, len = exprGroup.length; i < len; i++) {
        var exprPart = exprGroup[i];
        if (isOperator(exprPart) || isComparator(exprPart) || Utilities.isNumber(exprPart)) { continue; }
        namesReferencedInThisGroup.push(exprPart);
      }

      // Now build a list of expression names we know need to go before
      // this group. Exclude any names we know are already defined.
      var namesNeededToGoBeforeThisGroup = [];
      for (var i = 0, len = namesReferencedInThisGroup.length; i < len; i++) {
        var referencedName = namesReferencedInThisGroup[i];
        if (Utilities.doesInclude(alreadyDefinedNames, referencedName)) { continue; }
        if (Utilities.doesInclude(orderedGroupExpressionNames, referencedName)) { continue; }
        namesNeededToGoBeforeThisGroup.push(referencedName);
      }

      if (namesNeededToGoBeforeThisGroup.length > 0) {
        for (var i = 0, len = namesNeededToGoBeforeThisGroup.length; i < len; i++) {
          var dependencyName = namesNeededToGoBeforeThisGroup[i];
          orderedGroupExpressionNames.push(dependencyName);
        }
      }

      // Now that we have a precedence order, we can push the current
      // expression name to the end of the list.
      orderedGroupExpressionNames.push(exprName);
    });

    // With an ordered list of expression names, we can now attach the expression
    // descriptor objects to the output object.
    for (var i = 0, len = orderedGroupExpressionNames.length; i < len; i++) {
      var exprWrapper = {};
      var exprName = orderedGroupExpressionNames[i];
      if (groupExpressions[exprName]) {
        exprWrapper.name = exprName;
        exprWrapper.expression = groupExpressions[exprName];
        orderedGroupExpressions.push(exprWrapper);
      }
    }

    return orderedGroupExpressions;
  };

  // Find all expressions in the descriptor that are atomic, i.e. that have
  // a single numeric value (as opposed to an expression with operator).
  CassowaryBuilder.findAtomicExpressions = function(expressions) {
    var atomicExpressions = {};

    Utilities.eachProperty(expressions, function(exprValue, exprName) {
      if (Utilities.isNumber(exprValue)) {
        atomicExpressions[exprName] = parseFloat(exprValue);
      }
    });

    return atomicExpressions;
  };

  // Find all expressions in the descriptor that are group, i.e. that are
  // arrays describing a group formula.
  CassowaryBuilder.findGroupExpressions = function(expressions) {
    var groupExpressions = {};

    Utilities.eachProperty(expressions, function(exprValue, exprName) {
      if (Utilities.isArray(exprValue)) {
        groupExpressions[exprName] = exprValue;
      }
    });

    return groupExpressions;
  };



  // Build a set of Cassowary constraint objects using the already constructed
  // variables, expressions, and the constraint specifications passed in.
  CassowaryBuilder.buildConstraints = function(variables, expressions, constraints) {
    var builtConstraints = [];

    for (var i = 0, len = constraints.length; i < len; i++) {
      cstParts = constraints[i];

      // TODO/refactor Ain't this a beaut!
      var firstPart  = cstParts[0];
      var secondPart = cstParts[1];
      var thirdPart  = cstParts[2];
      var fourthPart = cstParts[3];
      var fifthPart  = cstParts[5];

      // TODO/refactor Messy messy messy!
      if (secondPart === KEY_EQ) {
        // We have an equation.
        firstPart = convertConstraintExpressionPart(firstPart, variables, expressions);
        thirdPart = convertConstraintExpressionPart(thirdPart, variables, expressions);
        var strength = convertConstraintStrengthPart(fourthPart, variables, expressions);
        var weight = fifthPart || 0;
        builtConstraints.push(new Cassowary.Equation(
          firstPart,
          thirdPart,
          strength,
          weight
        ));
      } else if (secondPart === KEY_LTE || secondPart === KEY_GTE) {
        // We've got an inequality.
        firstPart = convertConstraintExpressionPart(firstPart, variables, expressions);
        secondPart = convertConstraintInequalityPart(secondPart, variables, expressions);
        thirdPart = convertConstraintExpressionPart(thirdPart, variables, expressions);
        var strength = convertConstraintStrengthPart(fourthPart, variables, expressions);
        var weight = fifthPart || 0;
        builtConstraints.push(new Cassowary.Inequality(
          firstPart,
          secondPart,
          thirdPart,
          strength,
          weight
        ));
      } else if (secondPart === KEY_LT || secondPart === KEY_GT) {
        throw "The solver doesn't currently support '>' and '<'. Use '>=' and '<=' instead.";
      } else {
        // We'll assume this is a 'stay' constraint -- to keep a single value in place.
        firstPart = convertConstraintExpressionPart(firstPart, variables, expressions);
        var strength = convertConstraintStrengthPart(secondPart, variables, expressions);
        var weight = fifthPart || 0;
        builtConstraints.push(new Cassowary.StayConstraint(
          firstPart,
          strength,
          weight
        ));
      }
    };

    return builtConstraints;
  };

  function convertConstraintStrengthPart(part, variables, expressions) {
    if (Utilities.isString(part)) {
      if (part === KEY_WEAK) { return Cassowary.Strength.weak; }
      else if (part === KEY_MEDIUM) { return Cassowary.Strength.medium; }
      else if (part === KEY_STRONG) { return Cassowary.Strength.strong; }
      else if (part === KEY_REQ) { return Cassowary.Strength.required; }
      else {
        return Cassowary.Strength.medium;
      }
    } else {
      if (part instanceof Cassowary.Strength) {
        return part;
      }
    }
  }

  function convertConstraintExpressionPart(part, variables, expressions) {
    if (Utilities.isString(part)) {
      if (variables[part]) { return variables[part]; }
      else if (expressions[part]) { return expressions[part]; }
    } else if (Utilities.isNumber(part)) {
      return CassowaryBuilder.buildCassowaryConstantExpression(part);
    } else {
      if (isCassowaryVariable(part)) { return part; }
      else if (isCassowaryExpression(part)) { return part; }
    }
  }

  function convertConstraintInequalityPart(part) {
    if (part === KEY_LTE) { return Cassowary.LEQ; }
    else if (part === KEY_GTE) { return Cassowary.GEQ; }
    else if (part === Cassowary.LEQ) { return Cassowary.LEQ; }
    else if (part === Cassowary.GEQ) { return Cassowary.GEQ; }
    else {
      throw "Unknown inequality operator '" + part + "'.";
    }
  }



  // Take an object with Cassowary variable objects, *some of which may
  // have been extended with a 'reactiveFunction'*, and set up those functions
  // to work in tandem with the passed solver.
  CassowaryBuilder.buildFunctions = function(variableObjects, simplexSolver, context) {
    var functions = [];

    Utilities.eachProperty(variableObjects, function(varObj, varName) {
      var varFn = varObj.reactiveFunction;

      if (varFn) {
        functions.push(function() {
          var newVal = varFn.call(context);

          if (simplexSolver) {
            // One oddity is that nowhere in this library do I actually call
            // the 'addEditVar', 'beginEdit', 'endEdit' functions.
            // TODO/fixme. Figure out if we really need to call them and if
            // so, where the best place to do so would be.
            simplexSolver.suggestValue(varObj, newVal);
            simplexSolver.resolve();
          }
        });
      }
    });

    return functions;
  };


  module.exports = CassowaryBuilder;
});
