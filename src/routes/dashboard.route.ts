import { Hono } from 'hono'
import { html } from 'hono/html'

export const dashboardRoute = new Hono()

dashboardRoute.get('/', (c) => {
  return c.html(
    html`<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Healthcare ERP — Live Backend Telemetry & Monitoring</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #060913;
      --bg-card: rgba(15, 23, 42, 0.75);
      --bg-card-hover: rgba(30, 41, 59, 0.85);
      --border-color: rgba(51, 65, 85, 0.5);
      --border-highlight: rgba(56, 189, 248, 0.3);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-cyan: #06b6d4;
      --accent-blue: #3b82f6;
      --accent-emerald: #10b981;
      --accent-violet: #8b5cf6;
      --accent-rose: #f43f5e;
      --accent-amber: #f59e0b;
      --glow-cyan: 0 0 20px rgba(6, 182, 212, 0.25);
      --glow-emerald: 0 0 20px rgba(16, 185, 129, 0.25);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-primary);
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(6, 182, 212, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.08) 0%, transparent 40%);
      background-attachment: fixed;
      line-height: 1.5;
    }

    .container {
      max-width: 1380px;
      margin: 0 auto;
      padding: 24px 20px 60px;
    }

    /* Top Navigation / Header */
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 28px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: var(--glow-cyan);
    }

    .brand-text h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-text p {
      font-size: 13px;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-primary);
    }

    .btn:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-highlight);
      transform: translateY(-1px);
    }

    .btn-primary {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      border: none;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #0369a1, #1d4ed8);
    }

    .refresh-control {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.6);
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      font-size: 12px;
      color: var(--text-secondary);
    }

    select.refresh-select {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 12px;
      outline: none;
      cursor: pointer;
    }

    select.refresh-select option {
      background: #0f172a;
      color: #fff;
    }

    /* Live Pulse Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-badge.error {
      background: rgba(244, 63, 94, 0.15);
      color: #fb7185;
      border-color: rgba(244, 63, 94, 0.3);
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse-animation 2s infinite;
    }

    .pulse-dot.error {
      background: #f43f5e;
      box-shadow: 0 0 8px #f43f5e;
    }

    @keyframes pulse-animation {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    /* Grid Layout */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }

    .card:hover {
      border-color: var(--border-highlight);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .card-icon {
      font-size: 18px;
      opacity: 0.8;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
      font-family: 'JetBrains Mono', monospace;
    }

    .metric-subtext {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Progress bar */
    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background: rgba(51, 65, 85, 0.4);
      border-radius: 9999px;
      margin-top: 10px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #06b6d4, #3b82f6);
      border-radius: 9999px;
      transition: width 0.4s ease;
    }

    /* Two Column Section */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Canvas / Chart Container */
    .chart-container {
      position: relative;
      height: 160px;
      width: 100%;
      margin-top: 12px;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
    }

    /* Interactive API Tester */
    .playground-section {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 22px;
    }

    .endpoint-selector {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }

    .method-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    .endpoint-select {
      flex: 1;
      background: #0b1120;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 8px 12px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      outline: none;
    }

    .json-viewer {
      background: #050811;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #38bdf8;
      max-height: 240px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Badge Pills for Architecture */
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      margin-right: 6px;
      margin-bottom: 6px;
    }

    .badge-pill.success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }

    /* Footer */
    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header>
      <div class="brand-section">
        <div class="logo-badge" style="font-weight: bold; font-size: 16px; color: #fff;">ERP</div>
        <div class="brand-text">
          <h1>Healthcare ERP Backend <span class="status-badge" id="system-status-badge"><span class="pulse-dot"></span> Online</span></h1>
          <p>Modular-Monolith Architecture • Bun Runtime • Prisma PostgreSQL</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="refresh-control">
          <span>Auto Refresh:</span>
          <select id="refresh-interval" class="refresh-select" onchange="updateInterval()">
            <option value="3000" selected>3s</option>
            <option value="5000">5s</option>
            <option value="10000">10s</option>
            <option value="0">Pause</option>
          </select>
        </div>
        <button class="btn" onclick="fetchTelemetry()">Refresh</button>
        <a href="/docs" target="_blank" class="btn btn-primary">Swagger UI</a>
      </div>
    </header>

    <!-- Top Metrics Grid -->
    <div class="metrics-grid">
      <!-- Uptime -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Server Uptime</span>
          <span class="card-icon" style="font-size: 11px; font-weight: bold; color: var(--accent-cyan);">SYS</span>
        </div>
        <div class="metric-value" id="val-uptime">--:--:--</div>
        <div class="metric-subtext">
          <span id="val-env-badge" class="badge-pill">development</span>
          <span id="val-runtime">Bun</span>
        </div>
      </div>

      <!-- Memory -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Heap Memory</span>
          <span class="card-icon" style="font-size: 11px; font-weight: bold; color: var(--accent-violet);">RAM</span>
        </div>
        <div class="metric-value" id="val-heap">-- MB</div>
        <div class="metric-subtext">
          <span>RSS: <strong id="val-rss">-- MB</strong></span>
          <span>• Heap Total: <strong id="val-heap-total">-- MB</strong></span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="heap-progress" style="width: 0%;"></div>
        </div>
      </div>

      <!-- Database Connection & Latency -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">PostgreSQL Latency</span>
          <span class="card-icon" style="font-size: 11px; font-weight: bold; color: var(--accent-emerald);">DB</span>
        </div>
        <div class="metric-value" id="val-db-latency">-- ms</div>
        <div class="metric-subtext">
          <span id="val-db-badge" class="status-badge"><span class="pulse-dot"></span> Connected</span>
          <span>Probe: <strong id="val-telemetry-latency">-- ms</strong></span>
        </div>
      </div>

      <!-- Active Records -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Domain Entities</span>
          <span class="card-icon" style="font-size: 11px; font-weight: bold; color: var(--accent-blue);">REC</span>
        </div>
        <div class="metric-value" id="val-patients-count">-- Patients</div>
        <div class="metric-subtext">
          <span>Users: <strong id="val-users-count">--</strong></span>
          <span>• Audit Logs: <strong id="val-audit-count">--</strong></span>
        </div>
      </div>
    </div>

    <!-- Content Split: Latency Chart & Architectural Health -->
    <div class="content-grid">
      <!-- Live Latency Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Real-Time Database Latency (ms)</span>
          <span class="badge-pill success">Live Ping</span>
        </div>
        <div class="chart-container">
          <canvas id="latencyChart"></canvas>
        </div>
      </div>

      <!-- Architectural Boundaries & Governance -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Architectural Governance</span>
          <span class="card-icon" style="font-size: 11px; font-weight: bold; color: var(--accent-cyan);">GUARD</span>
        </div>
        <div style="margin-top: 10px;">
          <div style="margin-bottom: 12px;">
            <span class="badge-pill success">[OK] Boundaries Enforced</span>
            <span class="badge-pill success">[OK] Zero Deep Imports</span>
            <span class="badge-pill success">[OK] No Circular Deps</span>
            <span class="badge-pill success">[OK] API Drift: Clean</span>
            <span class="badge-pill">URI Versioning: /api/v1</span>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.6;">
            The Healthcare ERP Backend operates on an automated Modular-Monolith architecture. Static boundary analysis (<code style="color: var(--accent-cyan);">check-boundaries.ts</code>) and API contract drift detection (<code style="color: var(--accent-cyan);">check-api-drift.ts</code>) are validated automatically before builds.
          </p>
        </div>
      </div>
    </div>

    <!-- Live API Tester / Playground -->
    <div class="playground-section">
      <div class="card-header">
        <span class="card-title">Interactive API Endpoint Probe</span>
        <span id="probe-status" style="font-size: 12px; color: var(--text-muted);">Ready</span>
      </div>
      <div class="endpoint-selector">
        <span class="method-badge">GET</span>
        <select id="api-endpoint-select" class="endpoint-select">
          <option value="/health">/health — Live Health Probe</option>
          <option value="/api/v1/telemetry" selected>/api/v1/telemetry — Full System Vitals</option>
          <option value="/api/v1/users">/api/v1/users — Users Domain Module</option>
          <option value="/api/v1/patients">/api/v1/patients — Patients Domain Module</option>
          <option value="/">/ — API Root Discovery</option>
        </select>
        <button class="btn btn-primary" onclick="sendProbeRequest()">Execute Probe</button>
      </div>
      <div class="json-viewer" id="probe-response">// Response payload will appear here...</div>
    </div>

    <!-- Footer -->
    <footer>
      <span>Healthcare ERP Backend v1.0.2 • Telemetry Service</span>
      <span>API Endpoint: <code id="footer-host">http://localhost:3000</code></span>
    </footer>
  </div>

  <script>
    const latencyHistory = [];
    const maxPoints = 25;
    let refreshTimer = null;

    function formatUptime(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [h, m, s].map(v => v < 10 ? '0' + v : v).join(':');
    }

    async function fetchTelemetry() {
      try {
        const start = performance.now();
        const res = await fetch('/api/v1/telemetry');
        const latency = Math.round(performance.now() - start);
        
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const { data } = await res.json();

        // Update DOM metrics
        document.getElementById('val-uptime').innerText = formatUptime(data.system.uptimeSeconds);
        document.getElementById('val-env-badge').innerText = data.system.environment;
        document.getElementById('val-runtime').innerText = data.system.runtime;

        document.getElementById('val-heap').innerText = data.memory.heapUsedMB + ' MB';
        document.getElementById('val-rss').innerText = data.memory.rssMB + ' MB';
        document.getElementById('val-heap-total').innerText = data.memory.heapTotalMB + ' MB';
        document.getElementById('heap-progress').style.width = data.memory.heapUsagePercent + '%';

        document.getElementById('val-db-latency').innerText = data.database.latencyMs + ' ms';
        document.getElementById('val-telemetry-latency').innerText = latency + ' ms';

        document.getElementById('val-patients-count').innerText = data.entities.activePatients + ' Patients';
        document.getElementById('val-users-count').innerText = data.entities.activeUsers;
        document.getElementById('val-audit-count').innerText = data.entities.auditLogsCount;

        // Record latency history
        latencyHistory.push(data.database.latencyMs || latency);
        if (latencyHistory.length > maxPoints) latencyHistory.shift();
        drawChart();

      } catch (err) {
        console.error('Telemetry fetch failed:', err);
        document.getElementById('system-status-badge').className = 'status-badge error';
        document.getElementById('system-status-badge').innerHTML = '<span class="pulse-dot error"></span> Degraded';
      }
    }

    function drawChart() {
      const canvas = document.getElementById('latencyChart');
      const ctx = canvas.getContext('2d');
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;

      canvas.width = width * window.devicePixelRatio || width;
      canvas.height = height * window.devicePixelRatio || height;
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);

      if (latencyHistory.length < 2) return;

      const maxVal = Math.max(...latencyHistory, 10);
      const stepX = width / (maxPoints - 1);

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Gradient Area
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      ctx.beginPath();
      latencyHistory.forEach((val, idx) => {
        const x = idx * stepX;
        const y = height - (val / maxVal) * (height - 20) - 10;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo((latencyHistory.length - 1) * stepX, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw Line
      ctx.beginPath();
      latencyHistory.forEach((val, idx) => {
        const x = idx * stepX;
        const y = height - (val / maxVal) * (height - 20) - 10;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw Current Point
      const lastX = (latencyHistory.length - 1) * stepX;
      const lastY = height - (latencyHistory[latencyHistory.length - 1] / maxVal) * (height - 20) - 10;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    async function sendProbeRequest() {
      const endpoint = document.getElementById('api-endpoint-select').value;
      const statusEl = document.getElementById('probe-status');
      const responseEl = document.getElementById('probe-response');

      statusEl.innerText = 'Requesting ' + endpoint + '...';
      const start = performance.now();

      try {
        const res = await fetch(endpoint);
        const duration = Math.round(performance.now() - start);
        const data = await res.json();

        statusEl.innerHTML = '<span style="color: #34d399">HTTP ' + res.status + ' OK</span> (' + duration + ' ms)';
        responseEl.innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        statusEl.innerHTML = '<span style="color: #fb7185">Request Error</span>';
        responseEl.innerText = String(err);
      }
    }

    function updateInterval() {
      if (refreshTimer) clearInterval(refreshTimer);
      const interval = Number(document.getElementById('refresh-interval').value);
      if (interval > 0) {
        refreshTimer = setInterval(fetchTelemetry, interval);
      }
    }

    document.getElementById('footer-host').innerText = window.location.origin;

    // Initial load
    fetchTelemetry();
    sendProbeRequest();
    updateInterval();
    window.addEventListener('resize', drawChart);
  </script>
</body>
</html>`
  )
})
