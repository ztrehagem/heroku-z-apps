module.exports = (sequelize, DataTypes)=> {
  return sequelize.define('user', {
    name: {type: DataTypes.STRING, unique: true, validate: {is: /^\w+$/}},
    displayName: {type: DataTypes.STRING, validate: {notEmpty: true}},
    bio: DataTypes.TEXT
  });
};
