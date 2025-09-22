import { DataTypes, Sequelize } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';

const sequelize = new Sequelize({
    dialect: SqliteDialect,
    storage: 'db.sqlite',
});

export const DeviceTable = sequelize.define("Device", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
});

export const CO2ReadingTable = sequelize.define("CO2Reading", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    date: { type: DataTypes.DATE, allowNull: false },
    value: { type: DataTypes.DOUBLE, allowNull: false },
});

export const CH4ReadingTable = sequelize.define("CH4Reading", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    date: { type: DataTypes.DATE, allowNull: false },
    value: { type: DataTypes.DOUBLE, allowNull: false },
});

DeviceTable.hasMany(CO2ReadingTable)
DeviceTable.hasMany(CH4ReadingTable)

await sequelize.sync()