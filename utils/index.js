exports.values = (obj)=> {
  return Object.keys(obj).map((key)=> {
    return obj[key];
  });
};

exports.forEach = (obj, fn)=> {
  if (Array.isArray(obj)) {
    obj.forEach(fn);
  } else {
    Object.keys(obj).forEach((key)=> {
      fn(obj[key], key, obj);
    });
  }
};

exports.objectToArray = (obj)=> {
  return Object.keys(obj).map((key)=> [key, obj[key]]);
};

exports.joinArray = (twoDimArray)=> {
  return twoDimArray.reduce((result, each)=> result.concat(each), []);
};
