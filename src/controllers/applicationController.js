const { Application, Job } = require('../models');
const elasticsearchService = require('../services/elasticsearchService');

async function applyToJob(req, res) {
    try {
        const jobId = req.params.id;
        const { applicant_name, email, resume_url } = req.body;

        // Validate required fields
        if (!applicant_name || !email || !resume_url) {
            return res.status(400).json({
                error: 'Applicant name, email, and resume URL are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate resume URL format
        if (!resume_url.startsWith('http://') && !resume_url.startsWith('https://')) {
            return res.status(400).json({ error: 'Resume URL must start with http:// or https://' });
        }

        // Check if job exists
        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const application = await Application.create({
            job_id: jobId,
            applicant_name,
            email,
            resume_url
        });

        // Index in Elasticsearch
        await elasticsearchService.indexApplication(application);

        res.status(201).json(application);
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getAllApplications(req, res) {
    try {
        const { job_id, page = 1, limit = 10 } = req.query;
        
        // Calculate offset for pagination
        const offset = (page - 1) * limit;
        
        let whereCondition = {};
        if (job_id) {
            whereCondition.job_id = job_id;
        }

        const { count, rows: applications } = await Application.findAndCountAll({
            where: whereCondition,
            include: [{
                model: Job,
                as: 'job',
                attributes: ['id', 'title', 'location']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            applications,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: count,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    applyToJob,
    getAllApplications
};