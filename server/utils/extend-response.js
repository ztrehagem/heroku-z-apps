module.exports = extendResponse;

function extendResponse(resp) {
  return Object.assign(resp, ext);
}

var ext = {
  writeNotFound: function() {
    console.log('not found');
    this.writeHead(404, {'Content-Type': 'text/plain'});
    this.write('not found');
    this.end();
  }
};
