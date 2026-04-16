const { listIncidents } = require('../services/incidentService');

async function getIncidents(_req, res) {
  try {
    const incidents = await listIncidents();
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load incidents.' });
  }
}

module.exports = {
  getIncidents
};