import { useState } from 'react'
import type { FC } from 'react'
import { AlertTriangle, Check, Copy, Zap } from 'lucide-react'
import { Screen } from './Screen'
import { SevenSegment } from './SevenSegment'

interface Preset {
  path: string
  note: string
}

const PRESETS: Preset[] = [
  { path: '/api/v1', note: 'API root — the version index and what it advertises' },
  { path: '/health', note: 'Liveness, outside the versioned surface' },
  { path: '/api/v1/telemetry', note: 'The exact read this bench samples' },
  { path: '/api/v1/patients?limit=3&page=1', note: 'Paged patients with the standard meta envelope' },
  { path: '/api/v1/users?limit=3&page=1', note: 'Paged staff accounts, same envelope' },
  { path: '/api/v1/patients/does-not-exist', note: 'Deliberate miss — shows the real 404 error shape' },
  { path: '/docs/openapi.json', note: 'The generated contract itself' },
]

interface Result {
  status: number
  statusText: string
  contentType: string
  bytes: number
  ms: number
  body: string
}

export const RequestConsole: FC = () => {
  const [selected, setSelected] = useState(PRESETS[0].path)
  const [result, setResult] = useState<Result | null>(null)
  const [fault, setFault] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const send = async (path: string) => {
    setSelected(path)
    setBusy(true)
    setFault(null)
    setCopied(false)
    const started = performance.now()
    try {
      const res = await fetch(path, { headers: { Accept: 'application/json' } })
      const text = await res.text()
      const ms = performance.now() - started
      let body = text
      try {
        body = JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        // Not JSON — show exactly what came back rather than pretending.
      }
      setResult({
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get('content-type') ?? 'unstated',
        bytes: new TextEncoder().encode(text).length,
        ms,
        body,
      })
    } catch (err) {
      setResult(null)
      setFault(err instanceof Error ? err.message : 'request failed')
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setFault('Clipboard was refused by the browser — select the body and copy manually.')
    }
  }

  const bad = result ? result.status >= 400 : false

  return (
    <>
      <div className="head">
        <div className="head-t">
          <h2>Probe</h2>
          <span className="head-src">Live requests from this browser against the running service</span>
        </div>
        <span className="nom nom-xs">{PRESETS.length} probe points</span>
      </div>

      <div className="two-31">
        <fieldset className="blk">
          <legend>Probe point</legend>
          <div className="probe-list">
            {PRESETS.map((p) => (
              <button
                key={p.path}
                type="button"
                className="probe"
                aria-pressed={selected === p.path}
                onClick={() => void send(p.path)}
              >
                <span className="probe-path">GET {p.path}</span>
                <span className="probe-note">{p.note}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-pri btn-wide"
            style={{ marginTop: 12 }}
            disabled={busy}
            onClick={() => void send(selected)}
          >
            <Zap size={12} strokeWidth={2} className={busy ? 'spin' : undefined} aria-hidden="true" />
            {busy ? 'Probing' : 'Probe again'}
          </button>
        </fieldset>

        <div className="col">
          <div className="meas-row">
            <div className="meas">
              <div className="meas-k">
                <span className="nom">Status</span>
                <span className="lamp" data-tone={bad ? 'amber' : undefined} data-on={Boolean(result)} />
              </div>
              <SevenSegment
                value={result ? String(result.status) : '---'}
                label="HTTP status code"
                tone={bad ? 'amber' : 'phos'}
                height={34}
              />
              <p className="meas-note">
                {result ? result.statusText || (bad ? 'error envelope' : 'ok') : 'no probe taken'}
              </p>
            </div>

            <div className="meas">
              <div className="meas-k">
                <span className="nom">Round-trip</span>
                <span className="lamp" data-on={Boolean(result)} />
              </div>
              <SevenSegment
                value={result ? result.ms.toFixed(1) : '---.-'}
                label="Request round-trip"
                unit="ms"
                height={34}
              />
              <p className="meas-note">
                Measured in this tab with <code>performance.now()</code>, so it includes browser and network
                cost — not a server-side figure.
              </p>
            </div>

            <div className="meas">
              <div className="meas-k">
                <span className="nom">Payload</span>
                <span className="lamp" data-on={Boolean(result)} />
              </div>
              <SevenSegment
                value={result ? String(result.bytes) : '-----'}
                label="Response size in bytes"
                unit="bytes"
                height={34}
              />
              <p className="meas-note">{result ? result.contentType : 'content type unread'}</p>
            </div>
          </div>

          {fault && (
            <div className="plate" data-tone="fault" role="alert">
              <AlertTriangle size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
              <span>
                <b>Probe failed</b> — {fault}
              </span>
            </div>
          )}

          {bad && result && (
            <div className="plate" data-tone="armed">
              <AlertTriangle size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
              <span>
                HTTP {result.status} is the expected answer here. The body below is the service's real error
                envelope, carrying its <code>code</code>, <code>requestId</code> and <code>path</code> — the
                same shape every failure returns.
              </span>
            </div>
          )}

          <div className="bar">
            <span className="nom nom-xs">Response body</span>
            <div className="bar-end">
              <button type="button" className="btn btn-xs" onClick={() => void copy()} disabled={!result}>
                {copied ? (
                  <Check size={11} strokeWidth={2.6} aria-hidden="true" />
                ) : (
                  <Copy size={11} strokeWidth={2.2} aria-hidden="true" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <Screen graticule={false}>
            <pre className="payload" data-empty={!result} tabIndex={0} aria-label="Response body">
              {result ? result.body : 'Pick a probe point to send a request.'}
            </pre>
          </Screen>
        </div>
      </div>
    </>
  )
}
