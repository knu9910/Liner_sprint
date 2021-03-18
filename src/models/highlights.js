'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Highlights extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Users, {
        foreignKey: { name: 'userId', allowNull: false },
      });
      this.belongsTo(models.Pages, {
        foreignKey: { name: 'pageId', allowNull: false },
      });
    }
  }
  Highlights.init(
    {
      text: DataTypes.STRING,
      colorHex: DataTypes.STRING,
      pageId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Highlights',
    }
  );
  return Highlights;
};
