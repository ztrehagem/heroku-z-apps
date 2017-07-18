exports.parseHash = (rawHash)=> {
  return Object.keys(rawHash).reduce((obj, rawKey)=> {
    const value = rawHash[rawKey];
    const match = rawKey.match(/[^:]+/g);

    if (!match || !match.length) return;

    const key = match.pop();
    const namespaces = match;

    namespaces.reduce((target, namespace)=> {
      return (target[namespace] = target[namespace] || {});
    }, obj)[key] = value;

    return obj;
  }, {});
};

exports.buildHash = (()=> {
  const isObject = obj => obj !== null && typeof obj === 'object';

  const rec = (ret, stack, obj)=> {
    Object.keys(obj).forEach((key)=> {
      const value = obj[key];
      const _stack = [...stack, key];
      if (isObject(value)) {
        rec(ret, _stack, value);
      } else {
        ret[_stack.join(':')] = value;
      }
    });
    return ret;
  };

  return (obj)=> {
    if (!isObject(obj)) return obj;
    return rec({}, [], obj);
  };
})();
