const { listIncidents } = require('../services/logService');

async function getIncidents(req, res) {
  try {
    const incidents = await listIncidents(req.query);
    return res.json(incidents);
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to load incidents.' });
  }
}

module.exports = {
  getIncidents
};