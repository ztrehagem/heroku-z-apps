const $ = exports;

$.getAsJson = (req)=> {
  return req.body && JSON.parse(req.body);
};

$.sync = (req)=> {
  return new Promise((resolve, reject)=> {
    var strbuf = [];

    req.on('data', (chunk)=> {
      strbuf.push(chunk);
    });
    req.on('end', ()=> {
      var body = req.body = strbuf.join('');
      resolve(body);
    });
    req.on('error', ()=> {
      reject();
    });
  });
};
