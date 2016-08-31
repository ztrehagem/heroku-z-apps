module.exports = function(config, options) {
  return new Router(config, options);
};

module.exports.ns = function(name, paths, children) {
  if( typeof name != 'string' ) {
    children = paths;
    paths = name;
    name = null;
  }
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

function Router(config, options) {
  this.routes = [];
  this.options = options;
  createRoutes(this.routes, '', config);
}
Router.prototype.route = function(pathname) {
  var execResult;
  var route = this.routes.find(function(route) {
    return (execResult = route.regexp.exec(pathname));
  });
  return route && {
    uri: route.uri,
    ctrlPath: route.ctrlPath,
    actionName: route.actionName,
    params: route.convertParams(execResult.slice(1))
  };
};
function createRoutes(routes, stack, obj) {
  var name = obj.name;
  var currentStack = stack + (name || '');
  var paths = obj.paths;
  if( paths ) {
    for( var path in paths ) {
      routes.push(new Route(currentStack + path, stack + (name || '/root'), paths[path]));
    }
  }
  var children = obj.children;
  if( children ) {
    for( var i = 0; i < children.length; i++ ) {
      createRoutes(routes, currentStack + '/', children[i]);
    }
  }
}
Router.prototype.logRoutes = function() {
  console.log('------ routes ------');
  this.routes.forEach(function(route) {
    console.log(route.uri, '  -> ', route.ctrlPath + '#' + route.actionName);
  });
  console.log('--------------------');
};


function Route(uri, ctrlPath, actionName) {
  this.uri = uri;
  this.ctrlPath = ctrlPath;
  this.actionName = actionName;
  this.parse();
}
Route.prototype.parse = function() {
  this.regexp = new RegExp('^' + this.uri.replace(/:[^/]+/g, '([^/]+)').replace(/\//g, '\\/') + '$');
  this.paramKeys = this.uri.split('/').filter(function(path) {
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
