const express = require('express');

const {
  getDevices,
  createDevice,
  updateDeviceStatus
} = require('../controllers/deviceController');

const router = express.Router();

router.get('/', getDevices);
router.post('/', createDevice);
router.patch('/:id', updateDeviceStatus);

module.exports = router;