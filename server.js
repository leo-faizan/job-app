require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./src/config/database');
const elasticsearchService = require('./src/services/elasticsearchService');

// Import routes
const jobRoutes = require('./src/routes/jobs');
const applicationRoutes = require('./src/routes/applications');

// Import models to ensure relationships are set up
require('./src/models');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/jobs', jobRoutes);
app.use('/applications', applicationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Job Application API is running' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize database and start server
async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync database (create tables if they don't exist)
        // Use force: true to recreate tables (only for development)
        await sequelize.sync({ force: true });
        console.log('Database synchronized successfully.');

        // Initialize Elasticsearch indices
        await elasticsearchService.initializeIndices();
        console.log('Elasticsearch indices initialized.');

        // Start server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log('Available endpoints:');
            console.log('POST /jobs - Create a new job');
            console.log('GET /jobs - Get all jobs (supports ?location=&keyword= filters)');
            console.log('GET /jobs/:id - Get a job with its applications');
            console.log('POST /jobs/:id/apply - Apply to a job');
            console.log('GET /applications - Get all applications (supports ?job_id=&page=&limit= filters)');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();