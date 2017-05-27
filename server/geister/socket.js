module.exports = io => io.on('connection', socket => {

  let token = null;

  socket.on('join', (data, cb)=> {
    // redisの参加者情報を確認する
    console.log(data.id);
    token = data.token;
    socket.join(token, ()=> cb(true));

    if ('guest') {
      'emit';
    }
  });

});
