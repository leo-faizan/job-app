const Job = require('./Job');
const Application = require('./Application');

// Define relationships
Job.hasMany(Application, { 
    foreignKey: 'job_id',
    as: 'applications'
});

Application.belongsTo(Job, { 
    foreignKey: 'job_id',
    as: 'job'
});

module.exports = {
    Job,
    Application
};