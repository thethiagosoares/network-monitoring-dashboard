const { readJson, writeJson } = require('./fileStore');
const { logIncident } = require('./incidentService');

const DEVICES_FILE = 'devices.json';
const VALID_TYPES = new Set(['router', 'switch', 'link']);
const VALID_STATUSES = new Set(['online', 'offline']);

async function listDevices() {
  return readJson(DEVICES_FILE, []);
}

async function addDevice({ name, type, status }) {
  if (!VALID_TYPES.has(type)) {
    throw new Error('INVALID_TYPE');
  }

  if (!VALID_STATUSES.has(status)) {
    throw new Error('INVALID_STATUS');
  }

  const devices = await listDevices();
  const newDevice = {
    id: String(Date.now()),
    name,
    type,
    status
  };

  devices.push(newDevice);
  await writeJson(DEVICES_FILE, devices);
  return newDevice;
}

async function updateDevice(id, updates) {
  if (updates.status && !VALID_STATUSES.has(updates.status)) {
    throw new Error('INVALID_STATUS');
  }

  const devices = await listDevices();
  const deviceIndex = devices.findIndex((device) => device.id === id);

  if (deviceIndex === -1) {
    return null;
  }

  const currentDevice = devices[deviceIndex];
  const updatedDevice = {
    ...currentDevice,
    ...updates
  };

  devices[deviceIndex] = updatedDevice;
  await writeJson(DEVICES_FILE, devices);

  const wentOffline =
    currentDevice.status !== 'offline' && updatedDevice.status === 'offline';

  if (wentOffline) {
    await logIncident({
      deviceName: updatedDevice.name,
      issue: `${updatedDevice.type.toUpperCase()} connectivity lost.`
    });
  }

  return updatedDevice;
}

module.exports = {
  listDevices,
  addDevice,
  updateDevice
};