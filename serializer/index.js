const humps = require('humps');

var modules = require('require-dir')('./');

module.exports = Object.keys(modules).reduce(function(renamedModules, key) {
  renamedModules[humps.camelize(key)] = modules[key];
  return renamedModules;
}, {});
