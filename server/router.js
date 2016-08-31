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
Router.prototype.route = function(method, pathname) {
  var matches;
  var route = this.routes.find(function(route) {
    return route.method == method.toUpperCase() &&
      (matches = route.regexp.exec(pathname));
  });
  return route && {
    uri: route.uri,
    ctrlPath: route.ctrlPath,
    actionName: route.actionName,
    params: route.convertParams(matches.slice(1))
  };
};
function createRoutes(routes, stack, obj) {
  var name = obj.name;
  var currentStack = stack + (name || '');
  forObj(obj.paths || {}, function(path, actions) {
    if( typeof actions == 'string' ) {
      actions = {'get': actions};
    }
    forObj(actions, function(method, actionName) {
      routes.push(new Route(method, currentStack + path, stack + (name || '/root'), actionName));
    });
  });
  (obj.children || []).forEach(function(child) {
    createRoutes(routes, currentStack + '/', child);
  });
}
Router.prototype.logRoutes = function() {
  console.log('------ routes ------');
  this.routes.forEach(function(route) {
    console.log(route.method, route.uri, '  -> ', route.ctrlPath + '#' + route.actionName);
  });
  console.log('--------------------');
};

function Route(method, uri, ctrlPath, actionName) {
  this.method = method.toUpperCase();
  this.uri = uri;
  this.ctrlPath = ctrlPath;
  this.actionName = actionName;
  this.regexp = new RegExp('^' + this.uri.replace(/:[^/]+/g, '([^/]+)').replace(/\//g, '\\/') + '$');
  this.paramKeys = this.uri.split('/').filter(function(path) {
    return path.startsWith(':');
  }).map(function(path) {
    return path.substring(1);
  });
}
Route.prototype.convertParams = function(rowParams) {
  var params = {};
  for( var i = 0; i < this.paramKeys.length; i++ ) {
    params[this.paramKeys[i]] = rowParams[i];
  }
  return params;
};

function forObj(obj, fn) {
  Object.keys(obj).forEach(function(key) {
    fn(key, obj[key]);
  });
}
