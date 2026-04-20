const axios = require('axios');
const ping = require('ping');

const { listDevices, updateDevice } = require('./deviceService');

let monitoringTimer;
let monitorRunning = false;

async function runPingCheck(target) {
  const startedAt = Date.now();
  const result = await ping.promise.probe(target, { timeout: 5 });

  return {
    status: result.alive ? 'online' : 'offline',
    latency: result.time && result.time !== 'unknown' ? Number(result.time) : Date.now() - startedAt,
    error: result.alive ? null : `Ping failed for ${target}.`
  };
}

async function runHttpCheck(target) {
  const startedAt = Date.now();

  try {
    const response = await axios.get(target, {
      timeout: 5000,
      validateStatus: () => true
    });

    return {
      status: response.status >= 200 && response.status < 500 ? 'online' : 'offline',
      latency: Date.now() - startedAt,
      error: response.status >= 500 ? `Endpoint returned ${response.status}.` : null
    };
  } catch (error) {
    return {
      status: 'offline',
      latency: Date.now() - startedAt,
      error: error.message
    };
  }
}

async function checkDevice(device) {
  if (device.checkType === 'ping') {
    return runPingCheck(device.target);
  }

  if (device.checkType === 'http') {
    return runHttpCheck(device.target);
  }

  throw new Error(`Unsupported check type: ${device.checkType}`);
}

async function monitorDevices() {
  if (monitorRunning) {
    return;
  }

  monitorRunning = true;

  try {
    const devices = await listDevices();

    for (const device of devices) {
      try {
        const result = await checkDevice(device);
        await updateDevice(
          device.id,
          {
            status: result.status,
            latency: Number.isFinite(result.latency) ? Math.round(result.latency) : null,
            lastCheckedAt: new Date().toISOString(),
            lastError: result.error
          },
          { source: 'monitor' }
        );
      } catch (error) {
        await updateDevice(
          device.id,
          {
            status: 'offline',
            latency: null,
            lastCheckedAt: new Date().toISOString(),
            lastError: error.message
          },
          {
            source: 'monitor',
            eventType: 'ERROR',
            issue: error.message
          }
        );
      }
    }
  } finally {
    monitorRunning = false;
  }
}

function startMonitoringJob({ intervalMs = 10000 } = {}) {
  if (monitoringTimer) {
    return monitoringTimer;
  }

  monitorDevices().catch((error) => {
    console.error('Initial monitoring cycle failed:', error.message);
  });

  monitoringTimer = setInterval(() => {
    monitorDevices().catch((error) => {
      console.error('Monitoring cycle failed:', error.message);
    });
  }, intervalMs);

  return monitoringTimer;
}

module.exports = {
  startMonitoringJob
};