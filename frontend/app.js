const token = localStorage.getItem('authToken');
const storedUser = JSON.parse(localStorage.getItem('authUser') || 'null');

if (!token) {
  window.location.replace('/');
}

const deviceGrid = document.getElementById('device-grid');
const incidentTableBody = document.getElementById('incident-table-body');
const logTableBody = document.getElementById('log-table-body');
const deviceForm = document.getElementById('device-form');
const logFilterForm = document.getElementById('log-filter-form');
const logDeviceFilter = document.getElementById('log-device-filter');
const operatorName = document.getElementById('operator-name');
const topologyNodes = document.getElementById('topology-nodes');
const topologySvg = document.getElementById('topology-svg');

const summaryElements = {
  deviceCount: document.getElementById('device-count'),
  onlineCount: document.getElementById('online-count'),
  offlineCount: document.getElementById('offline-count'),
  averageLatency: document.getElementById('average-latency')
};

const state = {
  devices: [],
  logs: [],
  incidents: [],
  filters: {
    device: '',
    severity: '',
    sinceMinutes: ''
  }
};

const deviceIcons = {
  router: 'R',
  switch: 'S',
  link: 'L'
};

operatorName.textContent = storedUser?.username || 'Authenticated operator';

document.getElementById('logout-button').addEventListener('click', () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  window.location.replace('/');
});

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.replace('/');
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function formatLatency(latency) {
  return Number.isFinite(latency) ? `${latency} ms` : 'n/a';
}

function buildLogsQuery() {
  const params = new URLSearchParams();

  Object.entries(state.filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/logs?${query}` : '/logs';
}

function updateSummary(devices) {
  const onlineDevices = devices.filter((device) => device.status === 'online');
  const offlineDevices = devices.length - onlineDevices.length;
  const latencies = devices
    .map((device) => device.latency)
    .filter((latency) => Number.isFinite(latency));

  const averageLatency = latencies.length
    ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
    : 0;

  summaryElements.deviceCount.textContent = String(devices.length);
  summaryElements.onlineCount.textContent = String(onlineDevices.length);
  summaryElements.offlineCount.textContent = String(offlineDevices);
  summaryElements.averageLatency.textContent = `${averageLatency} ms`;
}

function renderDeviceOptions(devices) {
  const currentValue = state.filters.device;
  logDeviceFilter.innerHTML = '<option value="">All devices</option>';

  devices.forEach((device) => {
    const option = document.createElement('option');
    option.value = device.name;
    option.textContent = device.name;
    if (device.name === currentValue) {
      option.selected = true;
    }
    logDeviceFilter.appendChild(option);
  });
}

function calculateNodeLayout(devices) {
  const sorted = [...devices].sort((a, b) => {
    const order = { router: 0, switch: 1, link: 2 };
    return order[a.type] - order[b.type];
  });

  return sorted.map((device, index) => {
    const row = Math.floor(index / 5);
    const col = index % 5;

    return {
      ...device,
      x: 120 + col * 190 + (row % 2 ? 55 : 0),
      y: 95 + row * 125
    };
  });
}

function renderTopology(devices) {
  if (!topologyNodes || !topologySvg) {
    return;
  }

  if (!devices.length) {
    topologyNodes.innerHTML = '<div class="empty-state">No devices available for topology map.</div>';
    topologySvg.innerHTML = '';
    return;
  }

  const layout = calculateNodeLayout(devices);
  const links = [];

  for (let i = 1; i < layout.length; i += 1) {
    links.push({ from: layout[Math.max(0, i - 1)], to: layout[i] });
    if (i > 2) {
      links.push({ from: layout[Math.floor(i / 2)], to: layout[i] });
    }
  }

  topologySvg.innerHTML = links
    .map((link) => {
      const offline = link.from.status === 'offline' || link.to.status === 'offline';
      return `<line class="topology-line ${offline ? 'offline' : ''}" x1="${link.from.x}" y1="${link.from.y}" x2="${link.to.x}" y2="${link.to.y}" />`;
    })
    .join('');

  topologyNodes.innerHTML = layout
    .map((device) => {
      const statusClass = device.status === 'offline' ? 'offline' : 'online';
      return `
        <article class="topology-node ${statusClass}" style="left:${device.x}px;top:${device.y}px;">
          <div class="topology-node-icon">${deviceIcons[device.type] || 'N'}</div>
          <strong>${device.name}</strong>
          <small>${device.type.toUpperCase()} • ${formatLatency(device.latency)}</small>
        </article>
      `;
    })
    .join('');
}

function renderDevices(devices) {
  updateSummary(devices);
  renderDeviceOptions(devices);
  renderTopology(devices);

  if (!devices.length) {
    deviceGrid.innerHTML = '<div class="empty-state">No monitored devices yet.</div>';
    return;
  }

  deviceGrid.innerHTML = devices
    .map((device) => {
      const isOffline = device.status === 'offline';
      const primaryAction = isOffline ? 'Restore Status' : 'Simulate Failure';
      const nextStatus = isOffline ? 'online' : 'offline';
      const statusClass = isOffline ? 'offline' : 'online';

      return `
        <article class="device-card ${statusClass}">
          <div class="device-card-top">
            <div class="device-icon">${deviceIcons[device.type] || 'N'}</div>
            <div class="status-pill ${statusClass}">
              <span class="status-dot"></span>
              <span>${device.status}</span>
            </div>
          </div>
          <div class="device-meta">
            <h4>${device.name}</h4>
            <p>${device.type.toUpperCase()} • ${device.checkType.toUpperCase()}</p>
          </div>
          <dl class="device-stats">
            <div>
              <dt>Target</dt>
              <dd>${device.target}</dd>
            </div>
            <div>
              <dt>Latency</dt>
              <dd>${formatLatency(device.latency)}</dd>
            </div>
            <div>
              <dt>Last Check</dt>
              <dd>${device.lastCheckedAt ? formatTimestamp(device.lastCheckedAt) : 'pending'}</dd>
            </div>
            <div>
              <dt>Last Error</dt>
              <dd>${device.lastError || 'none'}</dd>
            </div>
          </dl>
          <div class="device-actions">
            <button data-id="${device.id}" data-status="${nextStatus}">${primaryAction}</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderIncidents(incidents) {
  if (!incidents.length) {
    incidentTableBody.innerHTML =
      '<tr><td colspan="3" class="empty-state">No critical incidents in the selected window.</td></tr>';
    return;
  }

  incidentTableBody.innerHTML = incidents
    .slice(0, 8)
    .map((incident) => `
      <tr>
        <td>${incident.deviceName}</td>
        <td>${incident.eventType}</td>
        <td>${formatTimestamp(incident.timestamp)}</td>
      </tr>
    `)
    .join('');
}

function renderLogs(logs) {
  if (!logs.length) {
    logTableBody.innerHTML =
      '<tr><td colspan="5" class="empty-state">No log events match the current filters.</td></tr>';
    return;
  }

  logTableBody.innerHTML = logs
    .map((entry) => `
      <tr>
        <td>
          <strong>${entry.deviceName}</strong>
          <div class="log-message">${entry.issue}</div>
        </td>
        <td><span class="severity-pill ${entry.severity.toLowerCase()}">${entry.severity}</span></td>
        <td>${entry.eventType}</td>
        <td>${formatLatency(entry.responseTime)}</td>
        <td>${formatTimestamp(entry.timestamp)}</td>
      </tr>
    `)
    .join('');
}

async function loadDashboard() {
  try {
    const [devices, incidents, logs] = await Promise.all([
      fetchJson('/devices'),
      fetchJson('/incidents'),
      fetchJson(buildLogsQuery())
    ]);

    if (!devices || !incidents || !logs) {
      return;
    }

    state.devices = devices;
    state.incidents = incidents;
    state.logs = logs;

    renderDevices(devices);
    renderIncidents(incidents);
    renderLogs(logs);
  } catch (_error) {
    deviceGrid.innerHTML = '<div class="empty-state">Unable to load dashboard data.</div>';
    incidentTableBody.innerHTML = '<tr><td colspan="3" class="empty-state">Unable to load incidents.</td></tr>';
    logTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Unable to load logs.</td></tr>';
  }
}

async function updateDeviceStatus(deviceId, status) {
  await fetchJson(`/devices/${deviceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

  await loadDashboard();
}

deviceGrid.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id]');

  if (!button) {
    return;
  }

  button.disabled = true;

  try {
    await updateDeviceStatus(button.dataset.id, button.dataset.status);
  } catch (error) {
    window.alert(error.message);
  } finally {
    button.disabled = false;
  }
});

deviceForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(deviceForm);
  const payload = {
    name: formData.get('name'),
    type: formData.get('type'),
    checkType: formData.get('checkType'),
    target: formData.get('target'),
    status: formData.get('status')
  };

  try {
    await fetchJson('/devices', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    deviceForm.reset();
    await loadDashboard();
  } catch (error) {
    window.alert(error.message);
  }
});

logFilterForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(logFilterForm);
  state.filters.device = formData.get('device');
  state.filters.severity = formData.get('severity');
  state.filters.sinceMinutes = formData.get('sinceMinutes');

  await loadDashboard();
});

loadDashboard();
setInterval(loadDashboard, 10000);