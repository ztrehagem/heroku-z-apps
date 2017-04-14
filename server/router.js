const ZRouter = require('z-router');

const router = module.exports = ZRouter(((ns)=>
  ns('root', [
    ns('api', [
      ns('geister', [
        ns('v1', [
          ns('exp', {
            '': {GET: 'get', POST: 'post', PUT: 'put', DELETE: 'delete'}
          }),
          ns('rooms', {
            '': {GET: 'index', POST: 'create'},
            ':token': {POST: 'join'},
            ':token/leave': {POST: 'leave'}
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
  ])
)(ZRouter.namespace));

console.log(router.routesToString());
