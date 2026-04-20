const {
  addDevice,
  listDevices,
  updateDevice
} = require('../services/deviceService');

async function getDevices(_req, res) {
  try {
    const devices = await listDevices();
    return res.json(devices);
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to load devices.' });
  }
}

async function createDevice(req, res) {
  try {
    const device = await addDevice(req.body);
    return res.status(201).json(device);
  } catch (error) {
    if (
      error.message.startsWith('INVALID_') ||
      error.message === 'MISSING_TARGET'
    ) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to create device.' });
  }
}

async function updateDeviceStatus(req, res) {
  try {
    const { id } = req.params;
    const updatedDevice = await updateDevice(id, req.body, {
      source: 'manual',
      actor: req.user.username
    });

    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    return res.json(updatedDevice);
  } catch (error) {
    if (error.message.startsWith('INVALID_')) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to update device.' });
  }
}

module.exports = {
  getDevices,
  createDevice,
  updateDeviceStatus
};