define(function(require, exports, module) {
  var FamousEngine = require('famous/core/Engine');
  var FamousSurface = require('famous/core/Surface');
  var CassowarySystem = require('cassowary-system/CassowarySystem');

  function CassowarySurface(options) {
    this.system = new CassowarySystem(options);
    this.variables = this.system.variables;
    this.formatters = options.formatters || {};

    FamousEngine.on('prerender', this.updateProperties.bind(this));

    FamousSurface.apply(this, arguments);
  }

  CassowarySurface.prototype = Object.create(FamousSurface.prototype);
  CassowarySurface.prototype.constructor = CassowarySurface;
  CassowarySurface.prototype.elementType = 'div';
  CassowarySurface.prototype.elementClass = 'famous-surface';

  CassowarySurface.prototype.updateProperties = function() {
    var properties = this.getProperties();
    var variables = this.system.variables;
    var formatters = this.formatters;
    var didAnyPropertiesChange = false;

    for (var variableName in variables) {
      if (variables.hasOwnProperty(variableName)) {
        var previous = properties[variableName];
        var variable = variables[variableName];
        var value = variable.value;
        var formatter = formatters[variableName];
        var formatted;

        if (formatter) {
          formatted = formatter(value);
        }

        if (formatted !== previous) {
          properties[variableName] = formatted;
          didAnyPropertiesChange = true;
        }
      }
    }

    if (didAnyPropertiesChange) {
      this.setProperties(properties);
    }
  };

  module.exports = CassowarySurface;
});
