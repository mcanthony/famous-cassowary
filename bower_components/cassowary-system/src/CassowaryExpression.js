define(function(require, exports, module) {
  var Utilities = require('cassowary-system/Utilities');
  var Cassowary = require('cassowary-system/Cassowary');
  var CassowaryVariable = require('cassowary-system/CassowaryVariable');
  var CassowaryParserHelper = require('cassowary-system/CassowaryParserHelper');


  // Base object for Cassowary expression functions.
  var CassowaryExpression = {};


  // Return T/F if the passed 'thing' is a Cassowary expression.
  CassowaryExpression.test = function(thing) {
    return thing instanceof Cassowary.Expression;
  };


  // Build the passed 'thing' into a Cassowary expression.
  CassowaryExpression.build = function(thing, references) {
    if (CassowaryExpression.test(thing)) {
      return thing;
    }

    if (CassowaryVariable.test(thing)) {
      return Cassowary.Expression.fromVariable(thing);
    }

    if (Utilities.isNumber(thing)) {
      return Cassowary.Expression.fromConstant(thing);
    }

    if (Utilities.isString(thing)) {
      if (references && references[thing]) {
        return CassowaryExpression.build(references[thing], references);
      } else {
        throw "Missing reference for string expression '" + thing + "'";
      }
    }

    // Might want to figure out a way to hand the function back
    // so it can be run reactively.
    if (Utilities.isFunction(thing)) {
      var functionVariable = CassowaryVariable.build(thing);
      return CassowaryExpression.build(functionVariable, references);
    }

    if (Utilities.isArray(thing)) {
      return CassowaryExpression.compose(thing, references);
    }

    throw "Unable to build argument into Cassowary expression";
  };


  // Build the passed 'array' into a Cassowary expression.
  CassowaryExpression.compose = function(array, references) {
    var elements = [];

    for (var i = 0, l = array.length; i < l; i++) {
      var candidate = array[i];
      var previous = Utilities.last(elements);

      if (Utilities.isString(candidate)) {
        if (CassowaryParserHelper.isOperatorString(candidate)) {
          if (previous) {
            if (CassowaryExpression.test(previous)) {
              elements.push(
                CassowaryParserHelper.operatorStringToFunctionName(candidate)
              );
            } else {
              throw "Operator '" + candidate + "' must be preceded by an expression";
            }
          } else {
            throw "Operator '" + candidate + "' cannot be preceded by null";
          }
        } else {
          if (references && references[candidate]) {
            elements.push(
              CassowaryExpression.build(references[candidate], references)
            );
          } else {
            throw "Missing reference for string expression'" + candidate + "'";
          }
        }
      } else {
        elements.push(CassowaryExpression.build(candidate, references));
      }
    }

    while (elements.length > 1) {
      var leftExpression = elements.shift();

      if (CassowaryExpression.test(leftExpression)) {
        var operatorString = elements.shift();
        var rightExpression = elements.shift();

        var evaluated = leftExpression[operatorString](rightExpression);

        elements.unshift(evaluated);
      }
    }

    var composed = elements.shift();
    return composed;
  };


  module.exports = CassowaryExpression;
});
