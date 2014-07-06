define(function(require, exports, module) {
  var Utilities = require('cassowary-system/Utilities');
  var Cassowary = require('cassowary-system/Cassowary');
  var CassowaryVariable = require('cassowary-system/CassowaryVariable');
  var CassowaryExpression = require('cassowary-system/CassowaryExpression');
  var CassowaryParserHelper = require('cassowary-system/CassowaryParserHelper');


  // Base object for Cassowary dependency functions.
  var CassowaryDependency = {};


  // Return an array that describes the order in which the
  // various Cassowary primitives should be constructed.
  CassowaryDependency.computeOrdering = function(object) {
    var ordering = [];

    Utilities.eachProperty(object, function(value, key) {
      if (Utilities.isNumber(value)) {
        if (!Utilities.doesInclude(ordering, key)) {
          ordering.unshift(key);
          return;
        }
      }

      if (CassowaryVariable.test(value)) {
        if (!Utilities.doesInclude(ordering, key)) {
          ordering.unshift(key);
          return;
        }
      }

      if (CassowaryExpression.test(value)) {
        if (!Utilities.doesInclude(ordering, key)) {
          ordering.unshift(key);
          return;
        }
      }

      if (Utilities.isFunction(value)) {
        if (!Utilities.doesInclude(ordering, key)) {
          ordering.unshift(key);
          return;
        }
      }

      if (Utilities.isArray(value)) {
        if (!Utilities.doesInclude(ordering, key)) {
          attachArray(key, value);
          ordering.push(key);
        }
      }

      if (Utilities.isString(value)) {
        throw "Atomic expressions cannot reference each other ('" + key + "': '" + value + "')";
      }
    });

    // Step through the expression array element by element,
    // looking for reference strings, and add those to the ordering
    // prior to current active the property name.
    function attachArray(name, array) {
      var subordering = [];

      for (var i = 0, l = array.length; i < l; i++) {
        var element = array[i];

        if (Utilities.isArray(element)) {
          attachArray(name, element);
        } else {
          if (Utilities.isString(element)) {
            if (CassowaryParserHelper.isOperatorString(element)) { continue; }
            if (CassowaryParserHelper.isComparatorString(element)) { continue; }
            if (CassowaryParserHelper.isStrengthString(element)) { continue; }

            if (element === name) {
              throw "An expression cannot reference itself ('" + name + "')";
            }

            if (!Utilities.doesInclude(ordering, element)) {
              if (!Utilities.doesInclude(subordering, element)) {
                subordering.push(element);
              } else {
                continue;
              }
            } else {
              continue;
            }
          }
        }
      }

      for (var i = 0, l = subordering.length; i < l; i++) {
        var name = subordering[i];

        if (!Utilities.doesInclude(ordering, name)) {
          ordering.push(name);
        }
      }
    }

    return ordering;
  };


  module.exports = CassowaryDependency;
});
