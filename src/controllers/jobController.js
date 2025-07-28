const { Job, Application } = require('../models');
const elasticsearchService = require('../services/elasticsearchService');

async function createJob(req, res) {
    try {
        const { title, description, location } = req.body;

        // Validate required fields
        if (!title || !description || !location) {
            return res.status(400).json({
                error: 'Title, description, and location are required'
            });
        }

        const job = await Job.create({ title, description, location });
        
        // Index in Elasticsearch
        await elasticsearchService.indexJob(job);

        res.status(201).json(job);
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getJobById(req, res) {
    try {
        const jobId = req.params.id;
        
        const job = await Job.findByPk(jobId, {
            include: [{
                model: Application,
                as: 'applications'
            }]
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getAllJobs(req, res) {
    try {
        const { location, keyword } = req.query;

        // If search filters are provided, use Elasticsearch
        if (location || keyword) {
            const jobs = await elasticsearchService.searchJobs({ location, keyword });
            return res.json(jobs);
        }

        // Otherwise, fetch from database
        const jobs = await Job.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function searchJobsWithFacets(req, res) {
    try {
        const { keyword, location, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
        
        // Validate limit
        const pageSize = Math.min(parseInt(limit) || 20, 100);
        const from = (parseInt(page) - 1) * pageSize;

        // Prepare filters
        const filters = {
            from,
            location
        };

        // Add date range if provided
        if (dateFrom || dateTo) {
            filters.dateRange = {};
            if (dateFrom) filters.dateRange.from = dateFrom;
            if (dateTo) filters.dateRange.to = dateTo;
        }

        const result = await elasticsearchService.searchJobsWithFacets(keyword, filters);

        res.json({
            success: true,
            data: {
                jobs: result.jobs,
                facets: result.facets,
                pagination: {
                    page: parseInt(page),
                    limit: pageSize,
                    total: result.total,
                    totalPages: Math.ceil(result.total / pageSize)
                }
            }
        });
    } catch (error) {
        console.error('Error searching jobs with facets:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error' 
        });
    }
}

module.exports = {
    createJob,
    getJobById,
    getAllJobs,
    searchJobsWithFacets
};