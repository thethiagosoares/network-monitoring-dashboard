const express = require('express');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const logRoutes = require('./routes/logRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');
const { startMonitoringJob } = require('./services/monitorService');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(express.json());
app.use(express.static(frontendPath));

app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Network Monitoring & Incident Dashboard',
    timestamp: new Date().toISOString()
  });
});

app.get('/probe/switch-core', (_req, res) => {
  res.json({ status: 'healthy', probe: 'switch-core', checkedAt: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use(authenticateToken);
app.use('/devices', deviceRoutes);
app.use('/incidents', incidentRoutes);
app.use('/logs', logRoutes);

app.get('*', (_req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  startMonitoringJob({ intervalMs: 10000 });
});