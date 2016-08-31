module.exports = router;

function router(pathname) {
  // TODO regexp matching
  return router.routes[pathname];
}
var routes = router.routes = {};

router.init = function(config) {
  createRoute('', config);
  logRoutes();
};

router.ns = function(name, paths, children) {
  if( Array.isArray(paths) ) {
    children = paths;
    paths = null;
  }

  return {
    name: name,
    paths: paths,
    children: children
  };
};

function createRoute(stack, obj) {
  var name = obj.name;
  var paths = obj.paths;
  if( paths ) {
    var controller = require('./controllers' + stack + '/' + (name || 'root'));
    for( var path in paths ) {
      routes[stack + (name ? '/' + name : '') + path] = controller[paths[path]];
    }
  }
  var children = obj.children;
  if( children ) {
    children.forEach(function(child) {
      createRoute(stack + (name ? '/' + name : ''), child);
    });
  }
}

function logRoutes() {
  console.log('--- routes ---');
  for( var route in routes ) console.log(routes[route] ? '          ' : 'undefined ', route);
  console.log('--------------');
}
