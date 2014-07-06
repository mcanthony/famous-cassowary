define(function(require, exports, module) {
  var Utilities = require('cassowary-system/Utilities');
  var Cassowary = require('cassowary-system/Cassowary');


  // Base object for parser helper functions.
  var CassowaryParserHelper = {};


  // String matchers.
  var KEY_ADD      = '+',
      KEY_SUBTRACT = '-',
      KEY_MULTIPLY = '*',
      KEY_DIVIDE   = '/',
      KEY_GT       = '>', // Not supported by the solver.
      KEY_LT       = '<', // Not supported by the solver.
      KEY_GTE      = '>=',
      KEY_LTE      = '<=',
      KEY_EQ       = '=',
      KEY_WEAK     = 'weak',
      KEY_MEDIUM   = 'medium',
      KEY_STRONG   = 'strong',
      KEY_REQ      = 'required';


  // Sets of matchers. Convenience.
  var OPERATORS = [KEY_ADD, KEY_SUBTRACT, KEY_MULTIPLY, KEY_DIVIDE];
  var COMPARATORS = [KEY_GTE, KEY_LTE, KEY_EQ];
  var STRENGTHS = [KEY_WEAK, KEY_MEDIUM, KEY_STRONG, KEY_REQ];


  // Return T/F whether the 'thing' is an operator,
  // e.g. +, -, *, /
  CassowaryParserHelper.isOperatorString = function(thing) {
    return Utilities.doesInclude(OPERATORS, thing);
  };


  // Convert the passed 'thing' into a function name.
  CassowaryParserHelper.operatorStringToFunctionName = function(thing) {
    switch (thing) {
      case KEY_ADD: return 'plus';
      case KEY_SUBTRACT: return 'minus';
      case KEY_MULTIPLY: return 'times';
      case KEY_DIVIDE: return 'divide';
      default: throw "Unknown Cassowary operator string '" + thing + "'";
    }
  };


  // Return T/F whether the 'thing' is a comparator,
  // e.g. >=, <=
  CassowaryParserHelper.isComparatorString = function(thing) {
    return Utilities.doesInclude(COMPARATORS, thing);
  };


  // Convert the passed 'thing' into a Cassowary comparator.
  CassowaryParserHelper.parseComparator = function(thing) {
    if (Utilities.isString(thing)) {
      switch (thing) {
        case KEY_LTE: return Cassowary.LEQ;
        case KEY_GTE: return Cassowary.GEQ;
        default: throw "Unknown Cassowary comparator string '" + thing + "'";
      }
    } else {
      switch (thing) {
        case Cassowary.LEQ: return Cassowary.LEQ;
        case Cassowary.GEQ: return Cassowary.GEQ;
        default: throw "Unable to parse argument into Cassowary comparator";
      }
    }
  };


  // Return T/F if the 'thing' is an equals sign.
  CassowaryParserHelper.isEquationString = function(thing) {
    return thing === KEY_EQ;
  };


  // Return T/F if the 'thing' is an inequality sign.
  CassowaryParserHelper.isInequalityString = function(thing) {
    return thing === KEY_GTE || thing === KEY_LTE;
  };


  // Return T/F if the 'thing' is an unsupported inequality sign.
  CassowaryParserHelper.isUnsupportedInequalityString = function(thing) {
    return thing === KEY_LT || thing === KEY_GT;
  };


  // Return T/F whether the 'thing' is a strength,
  // e.g. 'weak', 'medium', 'strong', 'required'
  CassowaryParserHelper.isStrengthString = function(thing) {
    return Utilities.doesInclude(STRENGTHS, thing);
  };


  // Convert the passed 'thing' into a Cassowary strength.
  CassowaryParserHelper.parseStrength = function(thing) {
    if (Utilities.isString(thing)) {
      switch (thing) {
        case KEY_WEAK: return Cassowary.Strength.weak;
        case KEY_MEDIUM: return Cassowary.Strength.medium;
        case KEY_STRONG: return Cassowary.Strength.strong;
        case KEY_REQ: return Cassowary.Strength.required;
        default: throw "Unrecognized Cassowary strength string '" + thing + "'";
      }
    } else {
      if (thing instanceof Cassowary.Strength) {
        return thing;
      } else {
        throw "Unable to parse argument into Cassowary strength";
      }
    }
  };


  module.exports = CassowaryParserHelper;
});
