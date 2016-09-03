var pg = require('pg');

pg.defaults.ssl = !!process.env.DATABASE_URL;

exports.test = (req, resp, params) => {

  pg.connect(process.env.DATABASE_URL || 'heroku-test', (err, client) => {
    if (err) throw err;
    console.log('Connected to postgres! Getting schemas...');

    var strbuf = [];

    client
      .query('SELECT table_schema,table_name FROM information_schema.tables;')
      .on('error', ()=> {
        resp.writeInternalServerError();
      })
      .on('row', (row)=> {
        // console.log(JSON.stringify(row));
        strbuf.push(JSON.stringify(row));
      })
      .on('end', ()=> {
        resp.writeHead('200', {'Content-Type': 'text/plain'});
        resp.write(process.env.DATABASE_URL);
        resp.end(strbuf.join(''));
      });
  });

  // resp.writeHead('200', {'Content-Type': 'text/plain'});
  // resp.end('db.');
};
