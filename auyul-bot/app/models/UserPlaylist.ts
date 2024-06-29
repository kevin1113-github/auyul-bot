import { Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  return sequelize.define('user_playlist', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    playlist: {
      type: DataTypes.JSON,
      allowNull: false,
    }
  });
};