import { Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  return sequelize.define('users', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  });
};