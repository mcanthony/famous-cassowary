define(function(require, exports, module) {

  // The cassowary.js lib exposes a 'c' global variable.
  // We're gone to module-ify it for clarity.
  require('cassowary');
  module.exports = c;

  // Delete the global 'c' to prevent accidental clobberage.
  delete c;

});
