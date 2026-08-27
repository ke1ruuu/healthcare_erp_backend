import React from 'react'
import { Activity, RefreshCw, BookOpen } from 'lucide-react'

interface NavbarProps {
  isOnline: boolean
  isFetching: boolean
  refreshInterval: number
  setRefreshInterval: (interval: number) => void
  onRefresh: () => void
  version: string
  environment: string
}

export const Navbar: React.FC<NavbarProps> = ({
  isOnline,
  isFetching,
  refreshInterval,
  setRefreshInterval,
  onRefresh,
  version,
  environment,
}) => {
  return (
    <header style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      paddingBottom: '24px',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--glow-cyan)'
        }}>
          <Activity size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em' }}>
              Healthcare ERP
            </h1>
            <span className={`badge ${isOnline ? 'badge-emerald' : 'badge-rose'}`} style={{ padding: '4px 10px', borderRadius: '9999px' }}>
              <span className="pulse-indicator" style={{ background: isOnline ? '#10b981' : '#f43f5e', boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #f43f5e' }} />
              {isOnline ? 'LIVE TELEMETRY' : 'DISCONNECTED'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span>v{version}</span>
            <span>•</span>
            <span className="badge badge-blue" style={{ fontSize: '10px' }}>{environment}</span>
            <span>•</span>
            <span>Modular-Monolith Architecture</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '6px 12px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <span>Poll Interval:</span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value={3000} style={{ background: '#0f172a' }}>3s (Fast)</option>
            <option value={5000} style={{ background: '#0f172a' }}>5s (Normal)</option>
            <option value={10000} style={{ background: '#0f172a' }}>10s</option>
            <option value={0} style={{ background: '#0f172a' }}>Pause</option>
          </select>
        </div>

        <button
          className="btn"
          onClick={onRefresh}
          disabled={isFetching}
          style={{ opacity: isFetching ? 0.7 : 1 }}
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>

        <a href="/docs" target="_blank" rel="noreferrer" className="btn btn-primary">
          <BookOpen size={14} />
          <span>Swagger UI</span>
        </a>
      </div>
    </header>
  )
}
