define(function(require, exports, module) {
  var Utilities = require('cassowary-system/Utilities');
  var Cassowary = require('cassowary-system/Cassowary');
  var CassowaryExpression = require('cassowary-system/CassowaryExpression');
  var CassowaryParserHelper = require('cassowary-system/CassowaryParserHelper');


  // Base object for Cassowary constraint functions
  var CassowaryConstraint = {};


  // Return T/F if the passed 'thing' is a Cassowary constraint.
  CassowaryConstraint.test = function(thing) {
    return thing instanceof Cassowary.Equation ||
           thing instanceof Cassowary.Inequality;
  };


  // Given an array expression of a constraint, build a Cassowary constraint.
  // E.g. ['width', '>=', 'height'] ~~> Cassowary.Inequality(...)
  CassowaryConstraint.build = function(elements, references) {
    var e1 = elements[0], // Hopefully a variable
        e2 = elements[1], // Probably an inequality/equation string
        e3 = elements[2], // Possibly a constant, expression or variable reference
        e4 = elements[3], // Possibly a strength
        e5 = elements[4]; // Possibly a weight

    if (!e1) {
      throw "Leading expression term cannot be blank";
    }

    e1 = CassowaryConstraint.parseTerm(e1, references);

    if (!e2) {
      console.warn("Got single-term expression; assuming a stay constraint");
      return new Cassowary.StayConstraint(e1, Cassowary.Strength.medium, 0);
    }

    if (CassowaryParserHelper.isUnsupportedInequalityString(e2)) {
      throw "The inequality string '" + e2 + "' is not supported; use '>=' or '<='";
    }

    // Builds an equation constraint.
    if (CassowaryParserHelper.isEquationString(e2)) {
      e3 = CassowaryConstraint.parseTerm(e3);
      e4 = CassowaryParserHelper.parseStrength(e4 || Cassowary.Strength.medium);
      e5 || (e5 = 0);
      return new Cassowary.Equation(e1, e3, e4, e5);
    }

    // Builds an inequality constraint.
    if (CassowaryParserHelper.isInequalityString(e2)) {
      e2 = CassowaryParserHelper.parseComparator(e2);
      e3 = CassowaryConstraint.parseTerm(e3);
      e4 = CassowaryParserHelper.parseStrength(e4 || Cassowary.Strength.medium);
      e5 || (e5 = 0);
      return new Cassowary.Inequality(e1, e2, e3, e4, e5);
    }

    throw "Unable to build constraint due to unexpected format";
  };


  // Convert the given constraint term into a usable object
  CassowaryConstraint.parseTerm = function(element, references) {
    if (Utilities.isString(element)) {
      if (references && references[element]) {
        return references[element];
      } else {
        throw "Missing reference for constraint term '" + element + "'";
      }
    }

    if (Utilities.isNumber(element)) {
      return CassowaryExpression.build(element);
    }

    if (CassowaryVariable.test(element)) {
      return CassowaryExpression.build(element);
    }

    if (CassowaryExpression.test(element)) {
      return element;
    }

    throw "Unable to parse constraint term";
  };


  module.exports = CassowaryConstraint;
});
