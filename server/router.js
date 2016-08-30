module.exports = router;

function router(pathname) {
  return router.routes[pathname];
}
var routes = router.routes = {};

router.init = function(config) {
  createRoute('', config, true);
  logRoutes();
};

function createRoute(path, array, isRoot) {
  if( !Array.isArray(array) ) return createChildren(path, array);

  var ctrl = require('./controllers' + path + (isRoot ? '/root' : ''));
  if( typeof ctrl == 'function' ) routes[isRoot ? '/' : path] = ctrl;

  array.forEach(function(name) {
    if( typeof name == 'string' ) routes[path + '/' + name] = ctrl[name];
    else createChildren(path, name);
  });
}

function createChildren(path, children) {
  for( var name in children ) createRoute(path + '/' + name, children[name]);
}

function logRoutes() {
  console.log('--- routes ---');
  for( var route in routes ) console.log(route);
  console.log('--------------');
}
