var ns = require('z-router').namespace;

module.exports = ns('root', {
  '/': {get: 'index'},
  '/one': 'one',
  '/form': {get: 'show', post: 'form'}
}, [
  ns('hoge', {
    '': 'hoge',
    '/hhh': 'hhh'
  }),
  ns('piyo', {
    '': 'piyo'
  }, [
    ns('foo', {
      '': 'foo',
      '/bar': 'bar'
    })
  ]),
  ns('api', [
    ns('v1', [
      ns('user', {
        '': 'index',
        '/create': 'create',
        '/:id/update': 'update'
      })
    ])
  ])
]);
