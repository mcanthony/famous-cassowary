define(function(require, exports, module) {
  var Utilities = require('famous-cassowary/Utilities');
  var Cassowary = require('famous-cassowary/Cassowary');
  var CassowaryBuilder = require('famous-cassowary/CassowaryBuilder');

  /*
   * CassowarySystem
   *
   * Create a Cassowary solver system for set of Cassowary-related options.
  */
  function CassowarySystem(options) {
    if (!this instanceof CassowarySystem) { return new CassowarySystem(options); }

    var solver = new Cassowary.SimplexSolver();
    var Builder = CassowaryBuilder;
    var variables = Builder.buildVariables(options.variables, solver);
    var expressions = Builder.buildExpressions(variables, options.expressions);
    var constraints = Builder.buildConstraints(variables, expressions, options.constraints);
    var functions = Builder.buildFunctions(variables, solver);

    this.solver = solver;
    this.variables = variables;
    this.expressions = expressions;
    this.constraints = constraints;
    this.functions = functions;

    this.solver.add.apply(this.solver, this.constraints);
  }

  module.exports = CassowarySystem;
});
