const express = require('express');

const { getIncidents } = require('../controllers/incidentController');

const router = express.Router();

router.get('/', getIncidents);

module.exports = router;