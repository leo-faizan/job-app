const express = require('express');
const router = express.Router();
const { createJob, getAllJobs, getJobById, searchJobsWithFacets } = require('../controllers/jobController');
const { applyToJob } = require('../controllers/applicationController');

// Job routes
router.post('/', createJob);
router.get('/', getAllJobs);
router.get('/search', searchJobsWithFacets);
router.get('/:id', getJobById);
router.post('/:id/apply', applyToJob);

module.exports = router;