const express = require('express');
const path = require('path');

const deviceRoutes = require('./routes/deviceRoutes');
const incidentRoutes = require('./routes/incidentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(express.json());
app.use(express.static(frontendPath));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Network Monitoring & Incident Dashboard',
    timestamp: new Date().toISOString()
  });
});

app.use('/devices', deviceRoutes);
app.use('/incidents', incidentRoutes);

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});