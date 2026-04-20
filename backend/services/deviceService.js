const { readJson, writeJson } = require('./fileStore');
const { recordLog } = require('./logService');

const DEVICES_FILE = 'devices.json';
const VALID_TYPES = new Set(['router', 'switch', 'link']);
const VALID_STATUSES = new Set(['online', 'offline']);
const VALID_CHECK_TYPES = new Set(['ping', 'http']);

function validateDevicePayload(payload, { partial = false } = {}) {
  if (!partial || payload.type !== undefined) {
    if (!VALID_TYPES.has(payload.type)) {
      throw new Error('INVALID_TYPE');
    }
  }

  if (!partial || payload.status !== undefined) {
    if (!VALID_STATUSES.has(payload.status)) {
      throw new Error('INVALID_STATUS');
    }
  }

  if (!partial || payload.checkType !== undefined) {
    if (!VALID_CHECK_TYPES.has(payload.checkType)) {
      throw new Error('INVALID_CHECK_TYPE');
    }
  }

  if ((!partial || payload.target !== undefined) && !payload.target) {
    throw new Error('MISSING_TARGET');
  }
}

async function listDevices() {
  return readJson(DEVICES_FILE, []);
}

async function saveDevices(devices) {
  await writeJson(DEVICES_FILE, devices);
  return devices;
}

async function addDevice(payload) {
  const device = {
    name: payload.name,
    type: payload.type,
    status: payload.status,
    checkType: payload.checkType,
    target: payload.target,
    latency: payload.latency ?? null,
    lastCheckedAt: payload.lastCheckedAt ?? null,
    lastError: payload.lastError ?? null
  };

  if (!device.name) {
    throw new Error('INVALID_NAME');
  }

  validateDevicePayload(device);

  const devices = await listDevices();
  const newDevice = {
    id: `dev-${Date.now()}`,
    ...device
  };

  devices.push(newDevice);
  await saveDevices(devices);

  return newDevice;
}

async function updateDevice(id, updates, metadata = {}) {
  const devices = await listDevices();
  const deviceIndex = devices.findIndex((device) => device.id === id);

  if (deviceIndex === -1) {
    return null;
  }

  validateDevicePayload(
    {
      ...devices[deviceIndex],
      ...updates
    },
    { partial: true }
  );

  const currentDevice = devices[deviceIndex];
  const updatedDevice = {
    ...currentDevice,
    ...updates
  };

  devices[deviceIndex] = updatedDevice;
  await saveDevices(devices);
  await recordStatusTransition(currentDevice, updatedDevice, metadata);

  return updatedDevice;
}

async function recordStatusTransition(previousDevice, currentDevice, metadata = {}) {
  const statusChanged = previousDevice.status !== currentDevice.status;

  if (!statusChanged && metadata.eventType !== 'ERROR') {
    return;
  }

  if (metadata.eventType === 'ERROR') {
    await recordLog({
      deviceId: currentDevice.id,
      deviceName: currentDevice.name,
      eventType: 'ERROR',
      issue: currentDevice.lastError || metadata.issue || 'Unexpected monitoring error.',
      severity: 'MEDIUM',
      responseTime: currentDevice.latency,
      source: metadata.source || 'monitor'
    });
    return;
  }

  const eventType = currentDevice.status === 'offline' ? 'DOWN' : 'UP';
  const issue = currentDevice.status === 'offline'
    ? `${currentDevice.type.toUpperCase()} became unreachable.`
    : `${currentDevice.type.toUpperCase()} connectivity restored.`;

  await recordLog({
    deviceId: currentDevice.id,
    deviceName: currentDevice.name,
    eventType,
    issue,
    severity: currentDevice.status === 'offline' ? 'HIGH' : 'LOW',
    responseTime: currentDevice.latency,
    source: metadata.source || 'system'
  });
}

module.exports = {
  addDevice,
  listDevices,
  updateDevice
};