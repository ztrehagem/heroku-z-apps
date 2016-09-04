var $ = exports;

var Type = $.Type = {
  JSON: 'json',
  TEXT: 'text'
};

$.writeCreated = (resp, type, body)=> {
  switch(type) {
  case Type.JSON: return $.writeJson(resp, 201, body);
  default: return $.writeText(resp, 201, body || 'Created');
  }
};

$.writeNoContent = (resp, type)=> {
  $.writeMessage(resp, 204, type);
};

$.writeBadRequest = (resp, type)=> {
  $.writeMessage(resp, 400, type, 'Bad Request');
};

$.writeNotFound = (resp, type)=> {
  $.writeMessage(resp, 404, type, 'Not Found');
};

$.writeInternalServerError = (resp, type)=> {
  $.writeMessage(resp, 500, type, 'Internal Server Error');
};

$.writeMessage = (resp, status, transformType, message)=> {
  switch(transformType) {
  case Type.JSON: return $.writeJson(resp, status, {message: message});
  default: $.writeText(resp, status, message);
  }
};

$.writeText = (resp, status, str)=> {
  if( !str ) { str = status; status = null; }
  $.writeResponse(resp, status || 200, Type.TEXT, str);
};

$.writeJson = (resp, status, obj)=> {
  if( !obj ) { obj = status; status = null; }
  $.writeResponse(resp, status || 200, Type.JSON, JSON.stringify(obj));
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
    case Type.TEXT: return resp.setHeader(CONTENT_TYPE, 'text/plain');
    case Type.JSON: return resp.setHeader(CONTENT_TYPE, 'application/json');
    default: resp.setHeader(CONTENT_TYPE, type || 'text/plain');
    }
  };
})();
