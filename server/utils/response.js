var $ = exports;

$.writeNotFound = (resp, type)=> {
  $.writeMessage(resp, 404, type, 'Not Found');
};

$.writeInternalServerError = (resp, type)=> {
  $.writeMessage(resp, 500, type, 'Internal Server Error');
};

$.writeMessage = (resp, status, transformType, message)=> {
  switch(transformType) {
  case 'json': return $.writeJson(resp, status, {message: message});
  default: $.writeText(resp, status, message);
  }
};

$.writeText = (resp, status, str)=> {
  if( !str ) { str = status; status = null; }
  $.writeResponse(resp, status || 200, 'text', str);
};

$.writeJson = (resp, status, obj)=> {
  if( !obj ) { obj = status; status = null; }
  $.writeResponse(resp, status || 200, 'json', JSON.stringify(obj));
};

$.writeResponse = (resp, status, contentType, bodyStr)=> {
  console.log('--- respond ---', status, contentType);
  console.log(bodyStr);
  console.log('---------------');
  $.setContentType(resp, contentType);
  resp.writeHead(status);
  resp.end(bodyStr);
};

$.setContentType = (()=> {
  const CONTENT_TYPE = 'Content-Type';

  return (resp, type)=> {
    switch(type.toLowerCase()) {
    case 'text': return resp.setHeader(CONTENT_TYPE, 'text/plain');
    case 'json': return resp.setHeader(CONTENT_TYPE, 'application/json');
    default: resp.setHeader(CONTENT_TYPE, type || 'text/plain');
    }
  };
})();
