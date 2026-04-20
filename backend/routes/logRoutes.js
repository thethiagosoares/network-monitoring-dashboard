const express = require('express');

const { getLogs } = require('../controllers/logController');

const router = express.Router();

router.get('/', getLogs);

module.exports = router;