var ns = require('z-router').namespace;

module.exports = ns('root', [
  ns('api', [
    ns('v1', [
      ns('user', {
        '': {GET: 'index', POST: 'create'},
        '/:id': {PUT: 'update'}
      })
    ])
  ])
]);
