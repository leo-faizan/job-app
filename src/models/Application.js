const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    job_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'jobs',
            key: 'id'
        }
    },
    applicant_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    resume_url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true
        }
    }
}, {
    tableName: 'applications',
    timestamps: true
});

module.exports = Application;