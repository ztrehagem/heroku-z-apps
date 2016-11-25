module.exports = class Response {

  constructor(resp) {
    this.raw = resp;
  }

  respondMessageJson(status, obj) {
    status = status || HttpStatus.OK;
    var body = JSON.stringify(obj || {
      status: status,
      statusMessage: HttpStatus[status]
    });
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
    body = body || HttpStatus[status];
    console.log('--- respond ---', status, contentType);
    console.log(body);
    console.log('---------------');
    this.setContentType(contentType);
    this.setStatus(status);
    this.raw.end(body);
  }

  setContentType(contentType) {
    this.setHeader('Content-Type', contentType);
  }

  setStatus(status) {
    this.raw.writeHead(status);
  }

  write() {
    this.raw.write.apply(this.raw, arguments);
  }

  setHeader(key, value) {
    this.raw.setHeader(key, value);
  }
};
