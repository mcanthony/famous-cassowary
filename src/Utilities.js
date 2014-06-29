define(function(require, exports, module) {

  var Utilities = {};

  // Iterate over the properties of the object, passing each into the iterator.
  // The iterator receives the value, the key, and the original object.
  function eachProperty(object, iterator, context) {
    for (var propertyName in object) {
      if (object.hasOwnProperty(propertyName)) {
        iterator.call(context || this, object[propertyName], propertyName, object);
      }
    }
  }

  // Return T/F if the 'haystack' contains the 'needle'.
  function doesInclude(haystack, needle) {
    for (var i = 0, len = haystack.length; i < len; i++) {
      var tuft = haystack[i];
      if (tuft === needle) { return true; }
    }
    return false;
  }

  // Return T/F if the passed variable is numeric.
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

  // Execute a composition of functions (evaluated in reverse order).
  // Taken from Underscore.js.
  function compose() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Return the passed 'thing' wrapped in a function that returns a function.
  function wrap(thing) {
    return function() { return thing; };
  }

  Utilities.wrap = wrap;
  Utilities.compose = compose;
  Utilities.last = last;
  Utilities.isString = isString;
  Utilities.isArray = isArray;
  Utilities.isNumber = isNumber;
  Utilities.isFunction = isFunction;
  Utilities.doesInclude = doesInclude;
  Utilities.eachProperty = eachProperty;

  module.exports = Utilities;

});
