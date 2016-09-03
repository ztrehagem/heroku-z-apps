exports.writeNotFound = function() {
  console.log('respond: Not Found');
  this.writeHead(404, {'Content-Type': 'text/plain'});
  this.write('not found');
  this.end();
};

exports.writeInternalServerError = function() {
  console.log('respond: Internal Server Error');
  this.writeHead(500, {'Content-Type': 'text/plain'});
  this.write('internal server error');
  this.end();
};
