exports.get = (req, resp, uriParams)=> {
  resp.respondJson(req.session.serializeForMe('geister'));
};

exports.update = (req, resp, uriParams)=> {
  const permits = ['name'];
  const params = req.bodyJson;

  Promise.all(Object.keys(params)
    .filter(key => permits.includes(key) && !!params[key])
    .map(key => req.session.put(`geister:${key}`, params[key]))
  )
  .then(()=> req.session.reload())
  .then(()=> resp.respondJson(req.session.serializeForMe('geister')));
};
