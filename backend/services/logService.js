const { readJson, writeJson } = require('./fileStore');

const LOGS_FILE = 'logs.json';

function normalizeSeverity(eventType, severity) {
  if (severity) {
    return severity;
  }

  if (eventType === 'DOWN') {
    return 'HIGH';
  }

  if (eventType === 'ERROR') {
    return 'MEDIUM';
  }

  return 'LOW';
}

async function listLogs(filters = {}) {
  const logs = await readJson(LOGS_FILE, []);
  const { device, severity, sinceMinutes } = filters;

  return logs
    .filter((entry) => {
      const matchesDevice = device ? entry.deviceName === device : true;
      const matchesSeverity = severity ? entry.severity === severity : true;
      const matchesTime = sinceMinutes
        ? Date.now() - new Date(entry.timestamp).getTime() <= Number(sinceMinutes) * 60 * 1000
        : true;

      return matchesDevice && matchesSeverity && matchesTime;
    })
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
}

async function recordLog({
  deviceId,
  deviceName,
  eventType,
  issue,
  severity,
  responseTime = null,
  source = 'system'
}) {
  const logs = await readJson(LOGS_FILE, []);
  const logEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    deviceId,
    deviceName,
    timestamp: new Date().toISOString(),
    eventType,
    issue,
    severity: normalizeSeverity(eventType, severity),
    responseTime,
    source
  };

  logs.push(logEntry);
  await writeJson(LOGS_FILE, logs);

  return logEntry;
}

async function listIncidents(filters = {}) {
  const logs = await listLogs(filters);

  return logs.filter((entry) => entry.eventType === 'DOWN' || entry.eventType === 'ERROR');
}

module.exports = {
  listIncidents,
  listLogs,
  recordLog
};