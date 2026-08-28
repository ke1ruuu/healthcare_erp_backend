import type { FC } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import type { Telemetry } from '../App'
import { formatUptime } from '../App'
import { Screen } from './Screen'
import { Beam, TRACE_WINDOW, pickScale } from './Beam'
import { SevenSegment } from './SevenSegment'

interface Props {
  data: Telemetry | null
  ch1: number[]
  ch2: number[]
  pollMs: number
  fault: string | null
  dbLost: boolean
  trigger: string
}

const SEGS = 20

/** Segmented bargraph. The last quarter is amber, the last tenth orange. */
const Meter: FC<{ ratio: number; low: string; high: string; label: string }> = ({
  ratio,
  low,
  high,
  label,
}) => {
  const filled = Math.round(Math.min(1, Math.max(0, ratio)) * SEGS)
  return (
    <div className="meter">
      <div className="meter-bar" role="img" aria-label={label}>
        {Array.from({ length: SEGS }, (_, i) => (
          <span
            key={i}
            className="meter-seg"
            data-on={i < filled}
            data-zone={i / SEGS >= 0.9 ? 'over' : i / SEGS >= 0.75 ? 'hi' : undefined}
          />
        ))}
      </div>
      <div className="meter-scale">
        <span className="nom nom-xs">{low}</span>
        <span className="nom nom-xs">{high}</span>
      </div>
    </div>
  )
}

/** Right-align a number into a fixed digit grid, blanking the unused cells. */
function seg(value: number | null, intDigits: number, decimals: number): string {
  if (value === null || !Number.isFinite(value)) {
    return '-'.repeat(intDigits + (decimals ? decimals + 1 : 0))
  }
  const text = decimals ? value.toFixed(decimals) : String(Math.round(value))
  const width = intDigits + (decimals ? decimals + 1 : 0)
  return text.length >= width ? text : ' '.repeat(width - text.length) + text
}

export const ServiceVitals: FC<Props> = ({ data, ch1, ch2, pollMs, fault, dbLost, trigger }) => {
  const peak = ch1.length ? Math.max(...ch1) : 0
  const mean = ch1.length ? ch1.reduce((a, b) => a + b, 0) / ch1.length : 0
  const now = ch1.length ? ch1[ch1.length - 1] : null

  // Real attenuator settings, so the graticule genuinely measures the trace.
  const msPerDiv = pickScale(Math.max(peak, 0.4), 3.5)
  const pctPerDiv = 25
  const secPerDiv = pollMs > 0 ? (pollMs / 1000) * 6 : 0

  const acquiring = ch1.length < 2

  return (
    <>
      <div className="head">
        <div className="head-t">
          <h2>Vitals</h2>
          <span className="head-src">GET /api/v1/telemetry · every value below is measured on read</span>
        </div>
        <span className="nom nom-xs">
          CH1 {msPerDiv} ms/div · CH2 {pctPerDiv} %/div ·{' '}
          {secPerDiv > 0 ? `${secPerDiv.toFixed(0)} s/div` : 'timebase held'}
        </span>
      </div>

      {fault && (
        <div className="plate" data-tone="fault" role="alert">
          <AlertTriangle size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
          <span>
            <b>Trigger lost</b> — the telemetry read failed ({fault}). Start the backend with{' '}
            <code>./run.sh dev</code> on port 3000, then take a single sweep. The window below holds the
            last samples taken before the signal dropped.
          </span>
        </div>
      )}

      {!fault && dbLost && (
        <div className="plate" data-tone="fault" role="alert">
          <AlertTriangle size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
          <span>
            <b>CH1 open</b> — the service answers but the Postgres round-trip failed, so round-trip and
            record counts are not measurable. CH2 continues.
          </span>
        </div>
      )}

      <Screen className="tube">
        <Beam
          ch1={ch1}
          ch2={ch2}
          msPerDiv={msPerDiv}
          pctPerDiv={pctPerDiv}
          pollMs={pollMs}
          live={!fault}
        />

        <div className="tube-osd" data-at="top">
          <span>
            <span className="osd-ch1">CH1 {msPerDiv} ms/div</span>
            <span className="osd-ch2" style={{ marginLeft: 14 }}>
              CH2 {pctPerDiv} %/div
            </span>
          </span>
          <span>
            {ch1.length}/{TRACE_WINDOW} samp
          </span>
        </div>

        <div className="tube-osd" data-at="bottom">
          <span className="osd-ch1">
            {now !== null && !dbLost
              ? `now ${now.toFixed(2)}  mean ${mean.toFixed(2)}  peak ${peak.toFixed(2)} ms`
              : 'CH1 no reading'}
          </span>
          <span>{trigger === 'AUTO' ? 'AUTO' : trigger}</span>
        </div>

        {acquiring && (
          <div className="tube-msg">
            <span className="nom nom-key">Acquiring</span>
            <span className="prose-dim" style={{ fontSize: 12 }}>
              The trace draws from the second sample. One arrives every{' '}
              {pollMs > 0 ? `${pollMs / 1000} s` : 'single sweep'}.
            </span>
          </div>
        )}
      </Screen>

      <div className="meas-row">
        <div className="meas">
          <div className="meas-k">
            <span className="nom">Uptime</span>
            <span className="lamp" data-on={Boolean(data)} />
          </div>
          <SevenSegment
            value={data ? formatUptime(data.system.uptimeSeconds) : '--:--:--'}
            label="Process uptime"
            height={34}
          />
          <p className="meas-note">
            {data ? `${data.system.runtime} · pid alive since first sample` : 'awaiting first sample'}
          </p>
        </div>

        <div className="meas">
          <div className="meas-k">
            <span className="nom">Heap in use</span>
            <span className="lamp" data-on={Boolean(data)} />
          </div>
          <SevenSegment
            value={seg(data ? data.memory.heapUsedMB : null, 3, 2)}
            label="Heap in use, megabytes"
            unit="MB"
            height={34}
          />
          <p className="meas-note">
            {data
              ? `${data.memory.heapUsagePercent}% of ${data.memory.heapTotalMB} MB · rss ${data.memory.rssMB} MB`
              : 'awaiting first sample'}
          </p>
          {data && (
            <Meter
              ratio={data.memory.heapUsagePercent / 100}
              low="0%"
              high="100%"
              label={`Heap in use ${data.memory.heapUsagePercent} percent of allocated heap`}
            />
          )}
        </div>

        <div className="meas">
          <div className="meas-k">
            <span className="nom">PG round-trip</span>
            <span className="lamp" data-tone={dbLost ? 'warn' : undefined} data-on={Boolean(data)} />
          </div>
          <SevenSegment
            value={seg(data && !dbLost ? data.database.latencyMs : null, 3, 2)}
            label="Postgres round-trip"
            unit="ms"
            tone={dbLost ? 'warn' : 'phos'}
            height={34}
          />
          <p className="meas-note">
            {data
              ? `${data.database.provider} · ${data.database.status} · telemetry probe ${data.telemetryLatencyMs} ms`
              : 'awaiting first sample'}
          </p>
          {data && !dbLost && (
            <Meter
              ratio={peak > 0 ? data.database.latencyMs / Math.max(peak, msPerDiv * 4) : 0}
              low="0 ms"
              high={`${(msPerDiv * 4).toFixed(1)} ms`}
              label={`Postgres round-trip ${data.database.latencyMs} milliseconds against a full-scale of ${(msPerDiv * 4).toFixed(1)} milliseconds`}
            />
          )}
        </div>

        <div className="meas">
          <div className="meas-k">
            <span className="nom">Active patients</span>
            <span className="lamp" data-on={Boolean(data) && !dbLost} />
          </div>
          <SevenSegment
            value={seg(data && !dbLost ? data.entities.activePatients : null, 4, 0)}
            label="Active patient records"
            height={34}
          />
          <p className="meas-note">
            {data && !dbLost
              ? `${data.entities.activeUsers} staff accounts · ${data.entities.auditLogsCount} audit rows · soft-deleted rows excluded`
              : 'not measurable while CH1 is open'}
          </p>
        </div>
      </div>

      <div className="plate">
        <Info size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
        <span>
          Both channels carry values measured at read time by the running process — there is no synthetic
          signal on this bench. The window holds the last {TRACE_WINDOW} samples only, so it is a live
          view and not a history: nothing here is retained across a reload.
        </span>
      </div>
    </>
  )
}
