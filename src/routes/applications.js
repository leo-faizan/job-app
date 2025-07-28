const express = require('express');
const router = express.Router();
const { getAllApplications } = require('../controllers/applicationController');

// Application routes
router.get('/', getAllApplications);

module.exports = router;