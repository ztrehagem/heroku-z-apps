app.filter('roomStatus', function() {
  'ngInject';
  const statuses = {
    accepting: '受付中',
    ready: '準備中',
    playing: 'ゲーム中',
    finished: '終了'
  };

  return (status)=> statuses[status];
});
