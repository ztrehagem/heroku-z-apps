module.exports = function(room) {
  return room && {
    id: room.id,
    status: room.status,
    name: room.name,
    playerNum: room.players.length,
    canJoin: room.canJoin(),
    createdAt: room.createdAt
  };
};
