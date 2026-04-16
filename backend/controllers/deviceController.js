const {
  listDevices,
  addDevice,
  updateDevice
} = require('../services/deviceService');

async function getDevices(_req, res) {
  try {
    const devices = await listDevices();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load devices.' });
  }
}

async function createDevice(req, res) {
  try {
    const { name, type, status } = req.body;

    if (!name || !type || !status) {
      return res.status(400).json({
        message: 'name, type and status are required.'
      });
    }

    const device = await addDevice({ name, type, status });
    return res.status(201).json(device);
  } catch (error) {
    if (error.message === 'INVALID_STATUS' || error.message === 'INVALID_TYPE') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to create device.' });
  }
}

async function updateDeviceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status is required.' });
    }

    const updatedDevice = await updateDevice(id, { status });

    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found.' });
    }

    return res.json(updatedDevice);
  } catch (error) {
    if (error.message === 'INVALID_STATUS') {
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