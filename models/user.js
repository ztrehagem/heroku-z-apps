module.exports = (sequelize, DataTypes)=> {
  return sequelize.define('user', {
    name: {type: DataTypes.STRING, unique: true},
    bio: DataTypes.TEXT
  });
};
