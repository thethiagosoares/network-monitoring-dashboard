const { readJson, writeJson } = require('./fileStore');

const INCIDENTS_FILE = 'incidents.json';

async function listIncidents() {
  const incidents = await readJson(INCIDENTS_FILE, []);
  return incidents.sort((left, right) => {
    return new Date(right.timestamp) - new Date(left.timestamp);
  });
}

async function logIncident({ deviceName, issue }) {
  const incidents = await readJson(INCIDENTS_FILE, []);
  const newIncident = {
    id: `inc-${Date.now()}`,
    deviceName,
    timestamp: new Date().toISOString(),
    issue
  };

  incidents.push(newIncident);
  await writeJson(INCIDENTS_FILE, incidents);

  return newIncident;
}

module.exports = {
  listIncidents,
  logIncident
};