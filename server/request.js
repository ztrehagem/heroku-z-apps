const colors = require('utils/colors');
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

    this.sessionPromise = (()=> {
      const token = this.cookie && this.cookie[Cookie.TOKEN];
      if (token) {
        return Session.get(token).then(session => session || Session.create());
      } else {
        return Session.create();
      }
    })()
    .then(session => this.session = session)
    .catch(err => console.warn(colors.bgRed + '# missing session' + colors.reset));
  }

  static get Cookie() {
    return Cookie;
  }

  assosiate(resp) {
    this._resp = resp;
    resp._req = this;
  }

  sync() {
    return Promise.all([
      new Promise((resolve, reject)=> {
        var strbuf = [];
        this.raw.on('data', (chunk)=> {
          strbuf.push(chunk);
        });
        this.raw.on('end', ()=> {
          this.body = strbuf.join('');
          resolve();
        });
        this.raw.on('error', ()=> {
          console.warn(colors.bgRed + '# sync request body error', strbuf, colors.reset);
          reject();
        });
      }),
      this.sessionPromise.then(session => this.session = session)
    ]).then(()=> this);
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
