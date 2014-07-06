define(function(require, exports, module) {
  var Utilities = require('cassowary-system/Utilities');
  var Cassowary = require('cassowary-system/Cassowary');
  var CassowaryDependency = require('cassowary-system/CassowaryDependency');
  var CassowaryVariable = require('cassowary-system/CassowaryVariable');
  var CassowaryExpression = require('cassowary-system/CassowaryExpression');
  var CassowaryConstraint = require('cassowary-system/CassowaryConstraint');


  // Constructor for CassowarySystem.
  function CassowarySystem(spec, options) {
    if (!this instanceof CassowarySystem) {
      return new CassowarySystem(spec, options);
    }

    this.options = Utilities.merge({
      autoSetup: true,
      autoAddEditVars: true,
      autoAddConstraints: true,
      autoTriggerReactiveVariables: true
    }, options || {});

    this.solver = new Cassowary.SimplexSolver();
    this.constraints = [];
    this.variables = {};
    this.expressions = {};
    this.functions = {};

    if (this.options.autoSetup) {
      this.setup(
        spec.variables || {},
        spec.expressions || {},
        spec.constraints || {}
      );
    }
  }


  // Set up the CassowarySystem.
  CassowarySystem.prototype.setup = function(variables, expressions, constraints) {
    var merged = Utilities.merge(variables, expressions);
    var ordering = CassowaryDependency.computeOrdering(merged);
    var created = {};

    // Construct Cassowary variable and expression objects.
    for (var i = 0, l = ordering.length; i < l; i++) {
      var dependency = ordering[i];

      if (variables[dependency]) {
        var variableSpec = variables[dependency];
        var variable = CassowaryVariable.build(variableSpec);
        created[dependency] = variable;
        this.variables[dependency] = variable;

        // If specified, assume all variables editable.
        if (this.options.autoAddEditVars) {
          this.solver.addEditVar(variable);
        }

        // Variables provided as functions have an additional hook.
        if (Utilities.isFunction(variableSpec)) {
          this.functions[dependency] = variableSpec;
        }
      } else if (expressions[dependency]) {
        var expressionSpec = expressions[dependency];
        var expression = CassowaryExpression.build(expressionSpec, created);
        created[dependency] = expression;
        this.expressions[dependency] = expression;
      }
    }

    // Construct Cassowary constraint objects.
    for (var i = 0, l = constraints.length; i < l; i++) {
      var constraintSpec = constraints[i];
      var constraint = CassowaryConstraint.build(constraintSpec, created);
      this.constraints.push(constraint);
    }

    // Add the constraints to the solver.
    if (this.options.autoAddConstraints) {
      this.solver.add.apply(this.solver, this.constraints);
    }

    // Kick off any reactive variable functions provided.
    if (this.options.autoTriggerReactiveVariables) {
      this.react();
    }
  };


  // Polyfill. Adds requestAnimationFrame functionality.
  // Source: http://strd6.com/2011/05/better-window-requestanimationframe-shim/
  window.requestAnimationFrame || (window.requestAnimationFrame =
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function(callback, element) {
      return window.setTimeout(function() {
        callback(+new Date());
    }, 1000 / 60);
  });


  // Trigger ongoing update of any functions provided reactively.
  CassowarySystem.prototype.react = function() {
    var solver = this.solver;
    var variables = this.variables;
    var functions = this.functions;

    function frame() {
      for (var key in functions) {
        if (functions.hasOwnProperty(key)) {
          var funktion = functions[key];
          var variable = variables[key];

          if (funktion && variable) {
            solver.suggestValue(variable, funktion());
          }
        }
      }

      solver.resolve();

      window.requestAnimationFrame(frame);
    }

    frame();
  };


  module.exports = CassowarySystem;
});
