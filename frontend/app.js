const deviceGrid = document.getElementById('device-grid');
const incidentTableBody = document.getElementById('incident-table-body');
const deviceForm = document.getElementById('device-form');

const summaryElements = {
  deviceCount: document.getElementById('device-count'),
  onlineCount: document.getElementById('online-count'),
  offlineCount: document.getElementById('offline-count')
};

const deviceIcons = {
  router: 'R',
  switch: 'S',
  link: 'L'
};

async function fetchJson(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function updateSummary(devices) {
  const onlineDevices = devices.filter((device) => device.status === 'online');
  const offlineDevices = devices.length - onlineDevices.length;

  summaryElements.deviceCount.textContent = String(devices.length);
  summaryElements.onlineCount.textContent = String(onlineDevices.length);
  summaryElements.offlineCount.textContent = String(offlineDevices);
}

function renderDevices(devices) {
  updateSummary(devices);

  if (!devices.length) {
    deviceGrid.innerHTML = '<div class="empty-state">No monitored devices yet.</div>';
    return;
  }

  deviceGrid.innerHTML = devices
    .map((device) => {
      const isOffline = device.status === 'offline';
      const primaryAction = isOffline ? 'Restore Status' : 'Simulate Failure';
      const nextStatus = isOffline ? 'online' : 'offline';

      return `
        <article class="device-card ${device.status}">
          <div class="device-icon">${deviceIcons[device.type] || 'N'}</div>
          <div class="device-meta">
            <h4>${device.name}</h4>
            <p>${device.type.toUpperCase()}</p>
          </div>
          <div class="status-pill">
            <span class="status-dot"></span>
            <span>${device.status}</span>
          </div>
          <div class="device-actions">
            <button data-id="${device.id}" data-status="${nextStatus}">
              ${primaryAction}
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderIncidents(incidents) {
  if (!incidents.length) {
    incidentTableBody.innerHTML =
      '<tr><td colspan="3" class="empty-state">No incidents registered.</td></tr>';
    return;
  }

  incidentTableBody.innerHTML = incidents
    .map((incident) => {
      return `
        <tr>
          <td>${incident.deviceName}</td>
          <td>${incident.issue}</td>
          <td>${formatTimestamp(incident.timestamp)}</td>
        </tr>
      `;
    })
    .join('');
}

async function loadDashboard() {
  try {
    const [devices, incidents] = await Promise.all([
      fetchJson('/devices'),
      fetchJson('/incidents')
    ]);

    renderDevices(devices);
    renderIncidents(incidents);
  } catch (error) {
    deviceGrid.innerHTML =
      '<div class="empty-state">Unable to load dashboard data.</div>';
    incidentTableBody.innerHTML =
      '<tr><td colspan="3" class="empty-state">Unable to load incidents.</td></tr>';
  }
}

async function updateDeviceStatus(deviceId, status) {
  await fetchJson(`/devices/${deviceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
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
    window.alert('Unable to update device status.');
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
    status: formData.get('status')
  };

  try {
    await fetchJson('/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    deviceForm.reset();
    await loadDashboard();
  } catch (error) {
    window.alert('Unable to add device.');
  }
});

loadDashboard();