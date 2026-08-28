import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Activity, Boxes, Terminal, ShieldHalf, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ServiceVitals } from './components/ServiceVitals'
import { MasterRecords } from './components/MasterRecords'
import { RequestConsole } from './components/RequestConsole'
import { BoundaryEnforcement } from './components/BoundaryEnforcement'
import { Knob } from './components/Knob'
import type { Detent } from './components/Knob'
import { TRACE_WINDOW } from './components/Beam'

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

type FnId = 'vitals' | 'records' | 'probe' | 'boundaries'

interface Fn {
  id: FnId
  ref: string
  name: string
  Icon: LucideIcon
}

const FNS: Fn[] = [
  { id: 'vitals', ref: 'SIG-01', name: 'Vitals', Icon: Activity },
  { id: 'records', ref: 'REC-02', name: 'Records', Icon: Boxes },
  { id: 'probe', ref: 'REQ-03', name: 'Probe', Icon: Terminal },
  { id: 'boundaries', ref: 'BND-04', name: 'Boundaries', Icon: ShieldHalf },
]

/** Sampling interval. HOLD stops the sweep without discarding the window. */
const DETENTS: Detent[] = [
  { value: 2000, legend: '2.0 s' },
  { value: 3000, legend: '3.0 s' },
  { value: 5000, legend: '5.0 s' },
  { value: 10000, legend: ' 10 s' },
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
  const [active, setActive] = useState<FnId>('vitals')
  const railRef = useRef<HTMLDivElement | null>(null)

  const sample = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch('/api/v1/telemetry')
      if (!res.ok) throw new Error(`telemetry responded HTTP ${res.status}`)
      const body = await res.json()
      const data: Telemetry = body.data
      setTelemetry(data)
      setFault(null)
      setCh1((prev) => [...prev, data.database.latencyMs].slice(-TRACE_WINDOW))
      setCh2((prev) => [...prev, data.memory.heapUsagePercent].slice(-TRACE_WINDOW))
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

  /** Arrow keys step the function selector, as a roving tablist should. */
  const onRailKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const order = FNS.map((f) => f.id)
    const i = order.indexOf(active)
    let next = i
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % order.length
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i - 1 + order.length) % order.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = order.length - 1
    else return
    event.preventDefault()
    setActive(order[next])
    railRef.current?.querySelectorAll<HTMLButtonElement>('button.fn')[next]?.focus()
  }

  const sys = telemetry?.system
  const dbLost = telemetry ? telemetry.database.status !== 'connected' : false
  const held = pollMs === 0

  // AUTO while sweeping, HELD when the knob is at HOLD, LOST on a failed read.
  const trigger = fault || dbLost ? 'LOST' : held ? 'HELD' : 'AUTO'
  const triggerTone = trigger === 'LOST' ? 'fault' : trigger === 'HELD' ? 'armed' : undefined

  return (
    <div className="bench">
      <div className="inst">
        <header className="bezel-top">
          <div className="ident">
            <h1 className="dm">Healthcare ERP</h1>
            <div className="desig">
              <span className="desig-model">SIGNAL BENCH · BACKEND MONITOR</span>
              <span className="desig-sep" aria-hidden="true" />
              <span className="desig-model">
                {sys ? `v${sys.version} · ${sys.environment} · port ${sys.port}` : 'awaiting first sample'}
              </span>
            </div>
          </div>

          <div className="strip">
            <div className="rbox" data-ch="1" data-state={dbLost || fault ? 'fault' : undefined}>
              <div className="rbox-k">
                <span className="lamp" data-on={!fault && !dbLost} data-live={fetching || undefined} />
                <span className="nom nom-xs">CH1 · PG round-trip</span>
              </div>
              <div className="rbox-v">
                {telemetry && !dbLost ? telemetry.database.latencyMs.toFixed(2) : '——'}
                <span className="unit">ms</span>
              </div>
            </div>

            <div className="rbox" data-ch="2">
              <div className="rbox-k">
                <span className="lamp" data-on={Boolean(telemetry)} />
                <span className="nom nom-xs">CH2 · heap in use</span>
              </div>
              <div className="rbox-v">
                {telemetry ? telemetry.memory.heapUsagePercent : '——'}
                <span className="unit">%</span>
              </div>
            </div>

            <div className="rbox" data-state={held ? 'armed' : undefined}>
              <div className="rbox-k">
                <span className="lamp" data-tone="amber" data-on={held} />
                <span className="nom nom-xs">Timebase</span>
              </div>
              <div className="rbox-v">
                {held ? 'HOLD' : (pollMs / 1000).toFixed(1)}
                {!held && <span className="unit">s/samp</span>}
              </div>
            </div>

            <div className="rbox" data-state={triggerTone}>
              <div className="rbox-k">
                <span
                  className="lamp"
                  data-tone={trigger === 'LOST' ? 'warn' : trigger === 'HELD' ? 'amber' : undefined}
                  data-on={trigger !== 'AUTO' || !fault}
                />
                <span className="nom nom-xs">Trigger</span>
              </div>
              <div className="rbox-v" role="status">
                {trigger}
              </div>
            </div>
          </div>
        </header>

        <div className="deck">
          <div className="rail">
            <fieldset className="blk">
              <legend>Function</legend>
              <div className="fns" role="tablist" aria-label="Bench function" ref={railRef} onKeyDown={onRailKey}>
                {FNS.map(({ id, ref, name, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    className="fn"
                    aria-selected={active === id}
                    tabIndex={active === id ? 0 : -1}
                    onClick={() => setActive(id)}
                  >
                    <Icon size={15} strokeWidth={1.7} className="fn-ico" aria-hidden="true" />
                    <span>
                      <span className="fn-name">{name}</span>
                      <span className="fn-ref">{ref}</span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <Knob label="Sec / sample" detents={DETENTS} value={pollMs} onChange={setPollMs} />

            <fieldset className="blk">
              <legend>Acquire</legend>
              <button
                type="button"
                className="btn btn-pri btn-wide"
                onClick={() => void sample()}
                disabled={fetching}
              >
                <Zap size={12} strokeWidth={2} className={fetching ? 'spin' : undefined} aria-hidden="true" />
                {fetching ? 'Sampling' : 'Single sweep'}
              </button>
              <p className="nom nom-xs" style={{ marginTop: 10, lineHeight: 1.6 }}>
                {ch1.length} / {TRACE_WINDOW} samples held
              </p>
            </fieldset>
          </div>

          <main className="work" key={active}>
            <div className="raster">
              {active === 'vitals' && (
                <ServiceVitals
                  data={telemetry}
                  ch1={ch1}
                  ch2={ch2}
                  pollMs={pollMs}
                  fault={fault}
                  dbLost={dbLost}
                  trigger={trigger}
                />
              )}
              {active === 'records' && <MasterRecords />}
              {active === 'probe' && <RequestConsole />}
              {active === 'boundaries' && <BoundaryEnforcement data={telemetry} />}
            </div>
          </main>
        </div>

        <footer className="apron">
          <span className="nom nom-xs">
            {sys ? `${sys.runtime} · ${sys.platform}/${sys.arch}` : 'runtime unread'} · modular monolith
          </span>
          <span className="apron-links">
            <a href="/docs" target="_blank" rel="noreferrer">
              swagger&nbsp;ui
            </a>
            <a href="/docs/openapi.json" target="_blank" rel="noreferrer">
              openapi.json
            </a>
            <a href="/health" target="_blank" rel="noreferrer">
              /health
            </a>
          </span>
        </footer>
      </div>
    </div>
  )
}

export default App
