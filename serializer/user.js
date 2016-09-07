module.exports = function(user) {
  return user && {
    name: user.displayName,
    bio: user.bio
  };
};
