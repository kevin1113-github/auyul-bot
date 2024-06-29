import { Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
	return sequelize.define('servers', {
		id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
    commandChannel: {
      type: DataTypes.STRING,
      allowNull: true,
    }
	});
};