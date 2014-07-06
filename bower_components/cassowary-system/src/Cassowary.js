define(function(require, exports, module) {

  // The cassowary.js lib exposes a 'c' global variable.
  // We'll module-ify it for clarity.
  require('cassowary');
  module.exports = c;

  // Delete global 'c' to prevent accidental clobberage.
  delete c;
});
