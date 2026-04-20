const { listLogs } = require('../services/logService');

async function getLogs(req, res) {
  try {
    const logs = await listLogs(req.query);
    return res.json(logs);
  } catch (_error) {
    return res.status(500).json({ message: 'Failed to load logs.' });
  }
}

module.exports = {
  getLogs
};