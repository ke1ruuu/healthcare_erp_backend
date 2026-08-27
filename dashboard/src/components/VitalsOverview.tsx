import React, { useEffect, useRef } from 'react'
import { Clock, Cpu, Database, Users } from 'lucide-react'

interface TelemetryData {
  system: {
    name: string
    version: string
    environment: string
    port: number
    uptimeSeconds: number
    runtime: string
    platform: string
    arch: string
  }
  memory: {
    rssMB: number
    heapUsedMB: number
    heapTotalMB: number
    heapUsagePercent: number
  }
  database: {
    status: string
    latencyMs: number
    provider: string
  }
  entities: {
    activeUsers: number
    activePatients: number
    auditLogsCount: number
  }
  architecture: {
    pattern: string
    boundariesStatus: string
    apiDriftStatus: string
  }
  telemetryLatencyMs: number
}

interface VitalsOverviewProps {
  data: TelemetryData | null
  latencyHistory: number[]
}

export const VitalsOverview: React.FC<VitalsOverviewProps> = ({ data, latencyHistory }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    const parts = [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0'),
    ]
    return (d > 0 ? `${d}d ` : '') + parts.join(':')
  }

  // Draw smooth HTML5 Canvas Sparkline
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || latencyHistory.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const parent = canvas.parentElement
    if (!parent) return

    const width = parent.clientWidth
    const height = parent.clientHeight
    const dpr = window.devicePixelRatio || 1

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    const maxVal = Math.max(...latencyHistory, 10)
    const stepX = width / (latencyHistory.length - 1)

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)'
    ctx.lineWidth = 1
    for (let i = 0; i < 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Gradient area fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)')
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)')

    ctx.beginPath()
    latencyHistory.forEach((val, idx) => {
      const x = idx * stepX
      const y = height - (val / maxVal) * (height - 24) - 12
      if (idx === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo((latencyHistory.length - 1) * stepX, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Smooth stroke
    ctx.beginPath()
    latencyHistory.forEach((val, idx) => {
      const x = idx * stepX
      const y = height - (val / maxVal) * (height - 24) - 12
      if (idx === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Endpoint dot
    const lastX = (latencyHistory.length - 1) * stepX
    const lastY = height - (latencyHistory[latencyHistory.length - 1] / maxVal) * (height - 24) - 12
    ctx.beginPath()
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#38bdf8'
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [latencyHistory])

  return (
    <div>
      {/* 4 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Uptime */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Uptime
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {data ? formatUptime(data.system.uptimeSeconds) : '--:--:--'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-blue">{data?.system.environment || 'development'}</span>
            <span>{data?.system.runtime || 'Bun'}</span>
          </div>
        </div>

        {/* Card 2: Memory Heap */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Heap Memory
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
              <Cpu size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {data ? `${data.memory.heapUsedMB} MB` : '-- MB'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>RSS: <strong style={{ color: 'var(--text-secondary)' }}>{data?.memory.rssMB || '--'} MB</strong></span>
            <span>Limit: <strong style={{ color: 'var(--text-secondary)' }}>{data?.memory.heapTotalMB || '--'} MB</strong></span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(51, 65, 85, 0.4)', borderRadius: '9999px', marginTop: '10px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                borderRadius: '9999px',
                width: `${data?.memory.heapUsagePercent || 0}%`,
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        {/* Card 3: PostgreSQL Latency */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PostgreSQL Ping
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Database size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {data ? `${data.database.latencyMs} ms` : '-- ms'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${data?.database.status === 'connected' ? 'badge-emerald' : 'badge-rose'}`}>
              <span className="pulse-indicator" style={{ width: '6px', height: '6px' }} />
              {data?.database.status === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
            <span>Probe: {data?.telemetryLatencyMs || '--'} ms</span>
          </div>
        </div>

        {/* Card 4: Entities */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Records
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {data ? `${data.entities.activePatients} Patients` : '-- Patients'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Users: <strong style={{ color: 'var(--text-secondary)' }}>{data?.entities.activeUsers || '--'}</strong></span>
            <span>Audit Logs: <strong style={{ color: 'var(--text-secondary)' }}>{data?.entities.auditLogsCount || '--'}</strong></span>
          </div>
        </div>
      </div>

      {/* Latency History & System Details Split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Latency Graph Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Database Latency Trendline (ms)
              </span>
              <span className="badge badge-emerald">Real-Time</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              Current: {data ? `${data.database.latencyMs} ms` : '--'}
            </span>
          </div>
          <div style={{ height: '160px', width: '100%', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* Runtime Environment & Architecture */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Server Environment & Specifications
            </span>
            <span className="badge badge-blue">Host Details</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(11, 17, 32, 0.7)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Runtime Engine</div>
              <div style={{ fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8' }}>
                {data?.system.runtime || 'Bun'}
              </div>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(11, 17, 32, 0.7)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Host Platform</div>
              <div style={{ fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                {data?.system.platform || 'macOS'} ({data?.system.arch || 'arm64'})
              </div>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(11, 17, 32, 0.7)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Port & Protocol</div>
              <div style={{ fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                HTTP :{data?.system.port || 3000}
              </div>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(11, 17, 32, 0.7)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Architecture Pattern</div>
              <div style={{ fontWeight: '600', color: '#34d399', fontSize: '12px' }}>
                Modular-Monolith
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
