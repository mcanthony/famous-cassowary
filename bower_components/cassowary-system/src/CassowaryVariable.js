define(function(require, exports, module) {
  var Utilities = require('cassowary-system/Utilities');
  var Cassowary = require('cassowary-system/Cassowary');


  // Base object for Cassowary variable functions.
  var CassowaryVariable = {};


  // Return T/F if the 'thing' is a Cassowary variable.
  CassowaryVariable.test = function(thing) {
    return thing instanceof Cassowary.AbstractVariable;
  };


  // Convert the passed 'thing' into a Cassowary variable.
  CassowaryVariable.build = function(thing) {
    if (CassowaryVariable.test(thing)) {
      return thing;
    }

    if (Utilities.isNumber(thing)) {
      return new Cassowary.Variable({ value: thing });
    }

    if (Utilities.isNumber(thing.value)) {
      return new Cassowary.Variable({ value: thing.value });
    }

    if (Utilities.isFunction(thing)) {
      return new Cassowary.Variable({ value: thing() });
    }

    throw "Unable to build argument into Cassowary variable";
  };


  module.exports = CassowaryVariable;
});
