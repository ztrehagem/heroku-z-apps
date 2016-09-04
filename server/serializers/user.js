module.exports = function(user) {
  return user && {
    id: user.id,
    name: user.name,
    bio: user.bio
  };
};
