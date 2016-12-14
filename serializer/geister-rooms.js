module.exports = function(room) {
  return room && {
    id: room.id,
    createdAt: room.createdAt
  };
};
