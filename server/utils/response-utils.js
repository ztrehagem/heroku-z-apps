exports.writeNotFound = function() {
  console.log('not found');
  this.writeHead(404, {'Content-Type': 'text/plain'});
  this.write('not found');
  this.end();
};
