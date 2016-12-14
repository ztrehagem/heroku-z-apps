exports.values = function(obj) {
  return Object.keys(obj).map((key)=> {
    return obj[key];
  });
};

exports.forEach = function(obj, fn) {
  if (Array.isArray(obj)) {
    obj.forEach(fn);
  } else {
    Object.keys(obj).forEach(function(key) {
      fn(obj[key], key, obj);
    });
  }
};
