const { Sequelize } = require('sequelize');

const sequelize = new Sequelize("test", "root", "password", {
    dialect: "mysql",
    host: "localhost",
    logging: false, // Set to console.log to see SQL queries
});

module.exports = sequelize;