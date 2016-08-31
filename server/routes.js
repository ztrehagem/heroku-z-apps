var ns = require('./router').ns;

module.exports = ns({
  '/': 'index',
  '/one': 'one',
  '/two': 'two'
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
