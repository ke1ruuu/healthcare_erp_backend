import { useState, useEffect } from 'react'
import { Activity, Database, Terminal, Shield, Sparkles } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { VitalsOverview } from './components/VitalsOverview'
import { DomainExplorer } from './components/DomainExplorer'
import { ApiWorkbench } from './components/ApiWorkbench'
import { ArchitectureGuard } from './components/ArchitectureGuard'

export function App() {
  const [telemetry, setTelemetry] = useState<any>(null)
  const [latencyHistory, setLatencyHistory] = useState<number[]>([])
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [refreshInterval, setRefreshInterval] = useState<number>(3000)
  const [activeTab, setActiveTab] = useState<'vitals' | 'domains' | 'api' | 'architecture'>('vitals')

  const fetchTelemetryData = async () => {
    try {
      setIsFetching(true)
      const start = performance.now()
      const res = await fetch('/api/v1/telemetry')
      const ping = Math.round(performance.now() - start)

      if (!res.ok) throw new Error('HTTP ' + res.status)
      const { data } = await res.json()

      setTelemetry(data)
      setIsOnline(true)

      setLatencyHistory((prev) => {
        const next = [...prev, data.database.latencyMs || ping]
        return next.slice(-25)
      })
    } catch (error) {
      console.error('Telemetry error:', error)
      setIsOnline(false)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchTelemetryData()
  }, [])

  useEffect(() => {
    if (refreshInterval <= 0) return
    const timer = setInterval(fetchTelemetryData, refreshInterval)
    return () => clearInterval(timer)
  }, [refreshInterval])

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <Navbar
        isOnline={isOnline}
        isFetching={isFetching}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        onRefresh={fetchTelemetryData}
        version={telemetry?.system.version || '1.0.2'}
        environment={telemetry?.system.environment || 'development'}
      />

      {/* Main Tab Navigation */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'vitals' ? 'active' : ''}`}
          onClick={() => setActiveTab('vitals')}
        >
          <Activity size={16} />
          <span>Live Telemetry & Vitals</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'domains' ? 'active' : ''}`}
          onClick={() => setActiveTab('domains')}
        >
          <Database size={16} />
          <span>Domain Modules Explorer</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <Terminal size={16} />
          <span>Interactive API Workbench</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          <Shield size={16} />
          <span>Architecture & Governance</span>
        </button>
      </nav>

      {/* Tab Content */}
      <main>
        {activeTab === 'vitals' && (
          <VitalsOverview data={telemetry} latencyHistory={latencyHistory} />
        )}

        {activeTab === 'domains' && (
          <DomainExplorer />
        )}

        {activeTab === 'api' && (
          <ApiWorkbench />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureGuard />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '24px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginTop: '40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} color="#06b6d4" />
          <span>Healthcare ERP Backend • React Vite Monitoring Suite</span>
        </div>
        <div>
          <span>API Host: </span>
          <code style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
            http://localhost:3000
          </code>
        </div>
      </footer>
    </div>
  )
}

export default App
