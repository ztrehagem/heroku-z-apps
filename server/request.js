const Session = require('./session');
const cookie = require('cookie');

const Cookie = {
  TOKEN: 'st',
};

module.exports = class Request {

  constructor(req) {
    this.raw = req;

    this.cookie = (()=> {
      return this.raw.headers.cookie && cookie.parse(this.raw.headers.cookie);
    })();

    this.session = (()=> {
      const token = this.cookie && this.cookie[Cookie.TOKEN];
      const session = token && token.length && Session.get(token);
      return session || Session.create();
    })();
  }

  static get Cookie() {
    return Cookie;
  }

  assosiate(resp) {
    this._resp = resp;
    resp._req = this;
  }

  sync() {
    return new Promise((resolve, reject)=> {
      var strbuf = [];
      this.raw.on('data', (chunk)=> {
        strbuf.push(chunk);
      });
      this.raw.on('end', ()=> {
        this.body = strbuf.join('');
        resolve(this);
      });
      this.raw.on('error', ()=> {
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
