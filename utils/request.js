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
      req.body = strbuf.join('');
      resolve(req);
    });
    req.on('error', ()=> {
      reject();
    });
  });
};
