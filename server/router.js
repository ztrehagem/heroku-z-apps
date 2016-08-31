module.exports = router;

var routes = router.routes = [];

function router(pathname) {
  var execResult;
  var route = routes.find(function(route) {
    return (execResult = route.regexp.exec(pathname));
  });
  return route && function(req, resp) {
    route.controller(req, resp, route.convertParams(execResult.slice(1)));
  };
}

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
  var currentStack = stack + (name ? '/' + name : '');
  var paths = obj.paths;
  if( paths ) {
    var ctrls = require('./controllers' + stack + '/' + (name || 'root'));
    for( var path in paths ) {
      routes.push(new Route(currentStack + path, ctrls[paths[path]]));
    }
  }
  var children = obj.children;
  if( children ) {
    children.forEach(function(child) {
      createRoute(currentStack, child);
    });
  }
}

function Route(uri, controller) {
  this.original = uri;
  this.controller = controller;
  this.parse();
}
Route.prototype.parse = function() {
  this.regexp = new RegExp('^' + this.original.replace(/:[^/]+/g, '([^/]+)').replace(/\//g, '\\/') + '$');
  this.paramKeys = this.original.split('/').filter(function(path) {
    return path.startsWith(':');
  }).map(function(path) {
    return path.substring(1);
  });
};
Route.prototype.convertParams = function(rowParams) {
  var params = {};
  for( var i = 0; i < this.paramKeys.length; i++ ) {
    params[this.paramKeys[i]] = rowParams[i];
  }
  return params;
};

function logRoutes() {
  console.log('------ routes ------');
  routes.forEach(function(route) {
    console.log(route.controller ? '          ' : 'undefined ', route.original);
  });
  console.log('--------------------');
}
