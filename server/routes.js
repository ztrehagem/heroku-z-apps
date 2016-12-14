var ns = require('z-router').namespace;

module.exports = ns('root', [
  ns('api', [
    ns('geister', [
      ns('v1', [
        ns('rooms', {
          '': {GET: 'index', POST: 'create'},
          ':id': {GET: 'view', POST: 'join', DELETE: 'leave'}
        })
      ])
    ]),
    ns('shift', [
      ns('v1', [
        ns('users', {
          '': {GET: 'index', POST: 'create'}
        }),
        ns('schedules', {
          '': 'index'
        }),
        ns('me', {
          '': {GET: 'show', PUT: 'update', DELETE: 'delete'}
        },[
          ns('schedules', {
            '': {GET: 'index', POST: 'create'},
            ':id': {GET: 'show', PUT: 'update', DELETE: 'delete'}
          })
        ])
      ])
    ])
  ])
]);
