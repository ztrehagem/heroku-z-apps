module.exports = class Request {

  constructor(req) {
    this.raw = req;
  }

  sync() {
    var self = this;
    return new Promise((resolve, reject)=> {
      var strbuf = [];
      self.raw.on('data', (chunk)=> {
        strbuf.push(chunk);
      });
      self.raw.on('end', ()=> {
        self.body = strbuf.join('');
        resolve(self);
      });
      self.raw.on('error', ()=> {
        console.log('reject', strbuf);
        reject();
      });
    });
  }

  getBodyAsJson() {
    return JSON.parse(this.body);
  }

  setSession(session) {
    this.session = session;
  }

  getSession(session) {
    return this.session;
  }
};
