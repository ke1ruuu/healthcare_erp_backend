import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ServiceVitals } from './components/ServiceVitals'
import { MasterRecords } from './components/MasterRecords'
import { RequestConsole } from './components/RequestConsole'
import { BoundaryEnforcement } from './components/BoundaryEnforcement'

export interface Telemetry {
  system: {
    name: string
    version: string
    environment: string
    port: number
    uptimeSeconds: number
    timestamp: string
    runtime: string
    platform: string
    arch: string
  }
  memory: {
    rssMB: number
    heapUsedMB: number
    heapTotalMB: number
    externalMB: number
    heapUsagePercent: number
  }
  database: { status: string; latencyMs: number; provider: string }
  entities: { activeUsers: number; activePatients: number; auditLogsCount: number }
  architecture: {
    pattern: string
    versioning: string
    boundariesStatus: string
    apiDriftStatus: string
    security: string
  }
  telemetryLatencyMs: number
}

/** The four severities a diagnostic can carry. Computed from readings, never chosen. */
export type Sev = 'note' | 'warn' | 'error' | 'help'

/** The window is a live view, not a history: sixty samples, then the oldest falls off. */
export const SAMPLE_WINDOW = 60

type CheckId = 'vitals' | 'records' | 'probe' | 'boundaries'

interface Check {
  id: CheckId
  code: string
  name: string
}

const CHECKS: Check[] = [
  { id: 'vitals', code: 'SVC-001', name: 'service vitals' },
  { id: 'records', code: 'REC-002', name: 'master records' },
  { id: 'probe', code: 'REQ-003', name: 'request probe' },
  { id: 'boundaries', code: 'BND-004', name: 'module boundaries' },
]

/** Sampling interval. HOLD stops the reads without discarding the window. */
const RATES: { value: number; legend: string }[] = [
  { value: 2000, legend: '2.0s' },
  { value: 3000, legend: '3.0s' },
  { value: 5000, legend: '5.0s' },
  { value: 10000, legend: '10s' },
  { value: 0, legend: 'HOLD' },
]

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const clock = [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
  return d > 0 ? `${d}d ${clock}` : clock
}

export function App() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null)
  const [ch1, setCh1] = useState<number[]>([])
  const [ch2, setCh2] = useState<number[]>([])
  const [fault, setFault] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)
  const [pollMs, setPollMs] = useState(3000)
  const [active, setActive] = useState<CheckId>('vitals')
  /** Incremented on every successful read. Drives the caret sweep by changing
      `data-strike`, so the annotation is re-struck rather than remounted. */
  const [reads, setReads] = useState(0)
  const checksRef = useRef<HTMLDivElement | null>(null)

  const sample = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch('/api/v1/telemetry')
      if (!res.ok) throw new Error(`telemetry responded HTTP ${res.status}`)
      const body = await res.json()
      const data: Telemetry = body.data
      setTelemetry(data)
      setFault(null)
      setCh1((prev) => [...prev, data.database.latencyMs].slice(-SAMPLE_WINDOW))
      setCh2((prev) => [...prev, data.memory.heapUsagePercent].slice(-SAMPLE_WINDOW))
      setReads((n) => n + 1)
    } catch (err) {
      setFault(err instanceof Error ? err.message : 'telemetry unreachable')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    void sample()
  }, [sample])

  useEffect(() => {
    if (pollMs <= 0) return
    const timer = setInterval(() => void sample(), pollMs)
    return () => clearInterval(timer)
  }, [pollMs, sample])

  /** Arrow keys step the check list, as a roving tablist should. */
  const onRailKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const order = CHECKS.map((c) => c.id)
    const i = order.indexOf(active)
    let next = i
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % order.length
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i - 1 + order.length) % order.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = order.length - 1
    else return
    event.preventDefault()
    setActive(order[next])
    checksRef.current?.querySelectorAll<HTMLButtonElement>('button.check')[next]?.focus()
  }

  const sys = telemetry?.system
  const dbLost = telemetry ? telemetry.database.status !== 'connected' : false
  const held = pollMs === 0

  /* Checking while sampling, held at the HOLD detent, aborted on a failed read.
     Same derivation the bench used, in the vocabulary of this world. */
  const run = fault || dbLost ? 'aborted' : held ? 'held' : 'checking'

  /* Severity is computed, never chosen. `error` is reserved for real faults and
     for values that cannot be measured — a heap over its own reported total is
     a `warn`, however far over it runs. BND-004 is a permanent `warn` because
     two of its statuses are string constants in the route, not results. */
  const heapPct = telemetry?.memory.heapUsagePercent ?? 0
  const sevOf: Record<CheckId, Sev> = {
    vitals: fault || dbLost ? 'error' : heapPct >= 75 ? 'warn' : 'note',
    records: fault || dbLost ? 'error' : 'note',
    probe: 'note',
    boundaries: 'warn',
  }

  const slug = sys ? sys.name.toLowerCase().replace(/\s+/g, '-') : 'healthcare-erp-backend'

  return (
    <div className="report">
      <div className="field">
        <div className="field-head">
          <b>
            checking {slug}
            {sys ? ` v${sys.version}` : ''}
          </b>
          <span>{sys ? `(${sys.environment}) · port ${sys.port}` : '(reading…)'}</span>
        </div>

        <div className="field-grp">
          <span className="field-label" id="checks-label">
            checks
          </span>
          <hr className="field-rule" />
          <div
            className="checks"
            role="tablist"
            aria-labelledby="checks-label"
            aria-orientation="vertical"
            ref={checksRef}
            onKeyDown={onRailKey}
          >
            {CHECKS.map(({ id, code, name }) => (
              <button
                key={id}
                type="button"
                role="tab"
                className="check"
                data-sev={sevOf[id]}
                aria-selected={active === id}
                tabIndex={active === id ? 0 : -1}
                onClick={() => setActive(id)}
              >
                <span>
                  <span className="check-code">{code}</span>
                  <span className="check-name">{name}</span>
                </span>
                <span className="check-sev">{sevOf[id]}</span>
              </button>
            ))}
          </div>
          <hr className="field-rule" />
        </div>

        <div className="field-grp">
          <span className="field-label" id="rate-label">
            sample rate
          </span>
          <div className="rate" role="group" aria-labelledby="rate-label">
            {RATES.map(({ value, legend }) => (
              <button
                key={value}
                type="button"
                className="rate-opt"
                aria-pressed={pollMs === value}
                onClick={() => setPollMs(value)}
              >
                {legend}
              </button>
            ))}
          </div>
          <div className="rate">
            <button
              type="button"
              className="rate-opt"
              onClick={() => void sample()}
              disabled={fetching}
            >
              {fetching ? 'reading…' : 'read now'}
            </button>
          </div>
        </div>

        <p className="field-note">
          <span className="sr">Run state: </span>
          {run === 'aborted'
            ? 'aborted — the last read did not complete.'
            : run === 'held'
              ? 'held — no further reads until the rate is set or you read now.'
              : `checking — one read every ${(pollMs / 1000).toFixed(1)} s.`}{' '}
          {ch1.length} of {SAMPLE_WINDOW} samples held; the oldest falls off.
        </p>

        <div className="field-foot">
          <a href="/docs" target="_blank" rel="noreferrer">
            /docs
          </a>
          <a href="/docs/openapi.json" target="_blank" rel="noreferrer">
            /docs/openapi.json
          </a>
          <a href="/health" target="_blank" rel="noreferrer">
            /health
          </a>
        </div>
      </div>

      <main className="sheet">
        {active === 'vitals' && (
          <ServiceVitals
            data={telemetry}
            ch1={ch1}
            ch2={ch2}
            pollMs={pollMs}
            fault={fault}
            dbLost={dbLost}
            run={run}
            seq={reads}
          />
        )}
        {active === 'records' && <MasterRecords />}
        {active === 'probe' && <RequestConsole />}
        {active === 'boundaries' && <BoundaryEnforcement data={telemetry} />}
      </main>
    </div>
  )
}

export default App
