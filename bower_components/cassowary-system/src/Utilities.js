define(function(require, exports, module) {

  // Base object for utility functions.
  var Utilities = {};

  // Iterate over the properties of the object, passing
  // each into the iterator. The iterator is passed the
  // value, the key, and the original object.
  function eachProperty(object, iterator, context) {
    for (var propertyName in object) {
      if (object.hasOwnProperty(propertyName)) {
        var iteratorContext = context || this;
        var objectProperty = object[propertyName];
        iterator.call(
          iteratorContext,
          objectProperty,
          propertyName,
          object
        );
      }
    }
  }

  // Merge two objects into a new object.
  function merge(a, b) {
    var c = {};

    eachProperty(a, function(v, k) {
      c[k] = v;
    });

    eachProperty(b, function(v, k) {
      if (v !== undefined) {
        c[k] = v;
      }
    });

    return c;
  }

  // Return T/F if the 'haystack' contains the 'needle'.
  function doesInclude(haystack, needle) {
    for (var i = 0, len = haystack.length; i < len; i++) {
      var tuft = haystack[i];
      if (tuft === needle) { return true; }
    }
    return false;
  }

  // Return T/F if the passed variable is a number.
  function isNumber(thing) {
    return !isNaN(parseFloat(thing)) && isFinite(thing);
  }

  // Return T/F if the passed variable is an array.
  function isArray(thing) {
    return Object.prototype.toString.call(thing) === '[object Array]';
  }

  // Return T/F if the passed variable is a string.
  function isString(thing) {
    return typeof thing == 'string' || thing instanceof String;
  }

  function isFunction(thing) {
    var o = {};
    return thing && o.toString.call(thing) === '[object Function]';
  }

  // Return the last member of the passed array.
  function last(array) {
    return array[array.length - 1];
  }

  Utilities.last = last;
  Utilities.isString = isString;
  Utilities.isArray = isArray;
  Utilities.isNumber = isNumber;
  Utilities.isFunction = isFunction;
  Utilities.doesInclude = doesInclude;
  Utilities.merge = merge;
  Utilities.eachProperty = eachProperty;

  module.exports = Utilities;

});
