import React, { useState } from 'react'
import { Play, Copy, Check, Terminal } from 'lucide-react'

const ENDPOINT_PRESETS = [
  { method: 'GET', path: '/health', label: 'Health Probe & Latency' },
  { method: 'GET', path: '/api/v1/telemetry', label: 'System Vitals & Memory' },
  { method: 'GET', path: '/api/v1/users', label: 'List Users (Paginated)' },
  { method: 'GET', path: '/api/v1/patients', label: 'List Patients (Paginated)' },
  { method: 'GET', path: '/', label: 'API Root Discovery' },
  { method: 'GET', path: '/docs/openapi.json', label: 'OpenAPI 3.1 Specification' },
]

export const ApiWorkbench: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('GET')
  const [path, setPath] = useState<string>('/api/v1/telemetry')
  const [requestBody, setRequestBody] = useState<string>('')
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseLatency, setResponseLatency] = useState<number | null>(null)
  const [responseData, setResponseData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const handleSelectPreset = (preset: { method: string; path: string }) => {
    setSelectedMethod(preset.method)
    setPath(preset.path)
  }

  const executeRequest = async () => {
    setLoading(true)
    setResponseStatus(null)
    setResponseLatency(null)

    const start = performance.now()

    try {
      const options: RequestInit = {
        method: selectedMethod,
        headers: { 'Content-Type': 'application/json' },
      }

      if (['POST', 'PUT', 'PATCH'].includes(selectedMethod) && requestBody.trim()) {
        options.body = requestBody
      }

      const res = await fetch(path, options)
      const duration = Math.round(performance.now() - start)
      setResponseStatus(res.status)
      setResponseLatency(duration)

      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json()
        setResponseData(json)
      } else {
        const text = await res.text()
        setResponseData(text)
      }
    } catch (err: any) {
      setResponseStatus(500)
      setResponseData({ error: err.message || 'Request Failed' })
    } finally {
      setLoading(false)
    }
  }

  const copyResponse = () => {
    if (!responseData) return
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {ENDPOINT_PRESETS.map((p, idx) => (
          <button
            key={idx}
            className="btn"
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              borderColor: path === p.path ? 'var(--accent-cyan)' : 'var(--border-color)',
              background: path === p.path ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-surface)',
            }}
            onClick={() => handleSelectPreset(p)}
          >
            <span className="badge badge-emerald" style={{ fontSize: '10px' }}>{p.method}</span>
            <span>{p.path}</span>
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
      }}>
        {/* Request Configurator */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Terminal size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Request Configurator
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="input-field"
              style={{ width: '100px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="input-field"
              style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace' }}
            />

            <button
              className="btn btn-primary"
              onClick={executeRequest}
              disabled={loading}
              style={{ minWidth: '100px' }}
            >
              <Play size={14} />
              <span>{loading ? 'Sending...' : 'Send'}</span>
            </button>
          </div>

          {['POST', 'PATCH', 'PUT'].includes(selectedMethod) && (
            <div style={{ marginTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                JSON Request Body
              </label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{\n  "firstName": "John",\n  "lastName": "Doe"\n}'
                className="input-field"
                style={{
                  width: '100%',
                  height: '140px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(11, 17, 32, 0.6)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Default Headers Included</div>
            <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
              Content-Type: application/json<br />
              Accept: application/json
            </div>
          </div>
        </div>

        {/* Response Inspector */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Response Payload
              </h3>
              {responseStatus !== null && (
                <span className={`badge ${responseStatus >= 200 && responseStatus < 300 ? 'badge-emerald' : 'badge-rose'}`}>
                  HTTP {responseStatus}
                </span>
              )}
              {responseLatency !== null && (
                <span className="badge badge-blue">
                  {responseLatency} ms
                </span>
              )}
            </div>

            {responseData && (
              <button className="btn" onClick={copyResponse} style={{ padding: '4px 10px', fontSize: '11px' }}>
                {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <pre style={{
            background: '#040711',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '16px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: '#38bdf8',
            maxHeight: '340px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {responseData ? JSON.stringify(responseData, null, 2) : '// Click "Send" to inspect real-time response...'}
          </pre>
        </div>
      </div>
    </div>
  )
}
