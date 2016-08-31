var Root = module.exports = {};

Root.index = function(req, resp, params) {
  console.log('root!', params);
};

Root.show = function(req, resp, params) {
  console.log('root,show', params);
};

Root.form = function(req, resp, params) {
  console.log('root,form', params);
};
