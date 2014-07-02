define(function(require, exports, module) {
  var Utilities = require('famous-cassowary/Utilities');
  var CassowarySystem = require('famous-cassowary/CassowarySystem');
  var FamousEngine = require('famous/core/Engine');
  var FamousSurface = require('famous/core/Surface');
  
  /* CassowarySurface
   *
   * A CassowarySurface is similar to a Famo.us Surface, except instead
   * of supplying just a 'properties' object, you also supply...
   *  * variables (numerical values that will change)
   *  * expressions (linear expressions of those variables and other constants)
   *  * constraints (constraints to be upheld when the solution is computed)
  */
  function CassowarySurface(options) {
    // Of course, not all numerical style properties are going to use the same
    // unit, but for simplicity in these "early days" we'll lock the end user into
    // using just one.
    this.defaultValueUnit = options.defaultValueUnit || 'px';

    // Initialize an internal Cassowary constraint system for this surface.
    this.cassowarySystem = new CassowarySystem({
      variables: options.variables || {},
      expressions: options.expressions || {},
      constraints: options.constraints || {}
    });

    this.variables = this.cassowarySystem.variables;
    this.formatters = options.formatters || {};
    this.expressions = this.cassowarySystem.expressions;
    this.constraints = this.cassowarySystem.constraints;
    this.functions = this.cassowarySystem.functions;

    FamousEngine.on('prerender', this.updateProperties.bind(this));

    FamousSurface.apply(this, arguments);
  }

  CassowarySurface.prototype = Object.create(FamousSurface.prototype);
  CassowarySurface.prototype.constructor = CassowarySurface;
  CassowarySurface.prototype.elementType = 'div';
  CassowarySurface.prototype.elementClass = 'famous-surface';

  // This runs on every 'tick' of the Famo.us engine as part of the 'prerender'
  // phase. This grabs all of the latest constrained variables and performs an
  // update on the actual surface's equivalently-named properties using a merge.
  CassowarySurface.prototype.updateProperties = function() {
    var properties = this.getProperties();
    var didAnyPropertiesChange = false;

    var functions = this.functions;
    for (var i = 0, len = functions.length; i < len; i++) {
      functions[i]();
    }

    var variables = this.cassowarySystem.variables;
    Utilities.eachProperty(variables, function(variableInstance, variableName) {
      var variableValue = variableInstance.value;

      var previousValue = properties[variableName];
      if (variableValue !== previousValue) {
        didAnyPropertiesChange = true;
      }

      var variableFormatter = this.formatters[variableName];
      var formattedVariableValue;

      if (variableFormatter) {
        formattedVariableValue = variableFormatter(variableValue);
      } else {
        if (Utilities.isNumber(variableValue)) {
          // Assume any number needs the 'defaultValueUnit' (px) suffixed.
          formattedVariableValue = variableValue + this.defaultValueUnit;
        }
      }

      // This always overwrites the previously assigned variable. FIXME?
      properties[variableName] = formattedVariableValue || variableValue;
    }, this);

    if (didAnyPropertiesChange) {
      this.setProperties(properties);
    }
  }

  module.exports = CassowarySurface;
});
