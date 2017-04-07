const colors = require('utils/colors');
const Cookie = require('cookie');
const Request = require('./request');

const Header = {
  CONTENT_TYPE: 'Content-Type',
  LOCATION: 'Location',
  SET_COOKIE: 'Set-Cookie',
};

module.exports = class Response {

  constructor(resp) {
    this.raw = resp;
  }

  static get Header() {
    return Header;
  }

  respondMessageJson(status, obj) {
    status = status || HttpStatus.OK;
    const body = obj && JSON.stringify(obj);
    this.respond(body, status, ContentType.JSON);
  }

  respondMessage(status, body) {
    status = status || HttpStatus.OK;
    body = body || HttpStatus[status];
    this.respond(body, status);
  }

  respondJson(obj, status) {
    this.respond(JSON.stringify(obj), status, ContentType.JSON);
  }

  respond(body, status, contentType) {
    contentType = contentType || ContentType.TEXT;
    status = status || HttpStatus.OK;
    console.log(`${colors.cyan}--- [res] ${status} ${contentType}${colors.reset}`);
    if (body) console.log(`${colors.cyan}${body}${colors.reset}`);
    this.setContentType(contentType);
    this.setSessionToken();
    this.setStatus(status);
    this.raw.end(body);
  }

  setContentType(contentType) {
    this.setHeader(Header.CONTENT_TYPE, contentType);
  }

  setSessionToken() {
    const cookieToken = this._req.cookie[Request.Cookie.TOKEN];
    const sessionToken = this._req.session.token;
    if (!cookieToken || !cookieToken.length || cookieToken != sessionToken) {
      this.setHeader(Header.SET_COOKIE, Cookie.serialize(Request.Cookie.TOKEN, sessionToken));
    }
  }

  setStatus(status) {
    this.raw.writeHead(status);
  }

  write(...args) {
    this.raw.write(...args);
  }

  setHeader(key, value) {
    this.raw.setHeader(key, value);
  }
};
