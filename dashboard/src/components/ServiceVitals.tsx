import type { FC, ReactNode } from 'react'
import type { Sev, Telemetry } from '../App'
import { SAMPLE_WINDOW, formatUptime } from '../App'

interface Props {
  data: Telemetry | null
  ch1: number[]
  ch2: number[]
  pollMs: number
  fault: string | null
  dbLost: boolean
  run: string
  /** Read counter. Changes on every successful read, which re-strikes the carets. */
  seq: number
}

/* A measured value, or nothing. Never a zero standing in for no reading — an
   unmeasurable value renders as an em dash, which is the project's rule. The
   values are tabular monospace, so columns line up without a digit grid; the
   old seven-segment blanking is carried by `.dash` instead of padded spaces. */
function read(value: number | null | undefined, decimals: number): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  return decimals ? value.toFixed(decimals) : String(Math.round(value))
}

/** A blank gutter row. Paired so the gutter rule stays unbroken through it. */
const Gap: FC<{ lg?: boolean }> = ({ lg }) => (
  <>
    <div className={lg ? 'gut gap-lg' : 'gut gap'} aria-hidden="true" />
    <div className={lg ? 'cell gap-lg' : 'cell gap'} />
  </>
)

/* A measured span and the caret run struck beneath it. The two rows share
   `--label-w`, so the carets land under the value by construction, and the run
   is exactly as long as the value it measures. */
const Span: FC<{
  label: string
  value: string | null
  unit?: string
  sev?: Sev
  seq: number
  note: ReactNode
}> = ({ label, value, unit, sev = 'note', seq, note }) => {
  const missing = value === null
  const display = missing ? '—' : unit ? `${value} ${unit}` : value

  return (
    <>
      <div className="span">
        <span className="span-label">{label}</span>
        <span
          key={`v${seq}`}
          className={missing ? 'span-val dash' : 'span-val'}
          data-sev={sev}
          data-strike={seq}
        >
          {display}
        </span>
      </div>
      <div className="span">
        <span aria-hidden="true" />
        <span className="span-ann">
          <span key={`c${seq}`} className="caret" data-sev={missing ? 'error' : sev} data-strike={seq}>
            {'^'.repeat(display.length)}
          </span>{' '}
          <span className="caret-note">{note}</span>
        </span>
      </div>
    </>
  )
}

/* The sample window: sixty hairline columns, one per held sample, newest at the
   right and named by `now`. Hand-built — a charting library is banned here. No
   gridlines, no baseline rule, no legend, no axis furniture. */
const Window: FC<{
  samples: number[]
  sev?: Sev
  unit: string
  decimals: number
  what: string
}> = ({ samples, sev = 'note', unit, decimals, what }) => {
  if (samples.length < 2) {
    return (
      <p className="win-empty">
        the window draws from the second read — {SAMPLE_WINDOW - samples.length} more to fill it
      </p>
    )
  }

  const peak = Math.max(...samples)
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  const now = samples[samples.length - 1]
  // Full scale is the peak the window actually holds, so the tallest column is
  // the largest reading taken — the window measures itself, nothing invented.
  const full = peak > 0 ? peak : 1
  const offset = SAMPLE_WINDOW - samples.length

  return (
    <>
      <svg
        className="win"
        viewBox={`0 0 ${SAMPLE_WINDOW} 100`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${what}: ${samples.length} samples held, newest ${now.toFixed(decimals)} ${unit}, mean ${mean.toFixed(decimals)} ${unit}, peak ${peak.toFixed(decimals)} ${unit}`}
      >
        {samples.map((value, i) => {
          const h = Math.max((value / full) * 96, 1)
          const x = offset + i + 0.5
          return (
            <line
              key={offset + i}
              className="win-col"
              data-now={i === samples.length - 1 ? 'true' : undefined}
              data-sev={i === samples.length - 1 ? sev : undefined}
              x1={x}
              x2={x}
              y1={100}
              y2={100 - h}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      <p className="win-lab">
        <span>
          now <b>{now.toFixed(decimals)}</b> {unit}
        </span>
        <span>
          mean <b>{mean.toFixed(decimals)}</b> {unit}
        </span>
        <span>
          peak <b>{peak.toFixed(decimals)}</b> {unit}
        </span>
        <span>
          held <b>{samples.length}</b> of {SAMPLE_WINDOW}
        </span>
      </p>
    </>
  )
}

export const ServiceVitals: FC<Props> = ({ data, ch1, ch2, pollMs, fault, dbLost, run, seq }) => {
  const heapPct = data?.memory.heapUsagePercent ?? null
  const heapOver = heapPct !== null && heapPct >= 100
  const heapHot = heapPct !== null && heapPct >= 75

  /* Severity is computed from the readings. `error` is reserved for a real fault
     or a value that cannot be measured; a heap over its own reported total is a
     `warn` however far over it runs, so an over-scale never makes the page read
     `error`. The page carries the worst row severity under that rule. */
  const rowSev = {
    uptime: (data ? 'note' : 'error') as Sev,
    heap: (!data ? 'error' : heapHot ? 'warn' : 'note') as Sev,
    trip: (!data || dbLost ? 'error' : 'note') as Sev,
    records: (!data || dbLost ? 'error' : 'note') as Sev,
  }
  const pageSev: Sev = Object.values(rowSev).includes('error')
    ? 'error'
    : Object.values(rowSev).includes('warn')
      ? 'warn'
      : 'note'

  const headline = fault
    ? ': the telemetry read did not complete'
    : dbLost
      ? ': the Postgres round-trip failed'
      : !data
        ? ': no reading yet'
        : heapHot
          ? ': service answers, heap is near the total it reports'
          : ': service answers and Postgres is reachable'

  return (
    <div className="diag">
      {/* Severity and provenance sit outside the gutter, as in a real diagnostic. */}
      <div className="cell cell-full">
        <p className="sev" data-sev={pageSev} role="status">
          <span className="sev-key">{pageSev}</span>
          <span className="sev-msg">{headline}</span>
        </p>
        <p className="prov">
          <span className="prov-arr" aria-hidden="true">
            --&gt;
          </span>
          GET /api/v1/telemetry
          {data ? (
            <>
              {' · '}
              <b>{data.telemetryLatencyMs} ms</b> probe
            </>
          ) : null}
          {data ? ` · ${run}` : ''}
        </p>
      </div>

      <Gap />

      <div className="gut">01</div>
      <div className="cell">
        <Span
          label="uptime"
          value={data ? formatUptime(data.system.uptimeSeconds) : null}
          sev={rowSev.uptime}
          seq={seq}
          note={
            data ? (
              <>
                <b>{data.system.runtime}</b> on {data.system.platform}/{data.system.arch} · alive since the
                process started
              </>
            ) : (
              'not measurable until a read completes'
            )
          }
        />
      </div>

      <Gap />

      <div className="gut">02</div>
      <div className="cell">
        <Span
          label="heap in use"
          value={read(heapPct, 0)}
          unit="%"
          sev={rowSev.heap}
          seq={seq}
          note={
            data ? (
              <>
                <b>{data.memory.heapUsedMB} MB</b> in use against the {data.memory.heapTotalMB} MB total the
                runtime reports · rss {data.memory.rssMB} MB
                {heapOver ? ' — in use runs over that total, and is reported here as measured' : ''}
              </>
            ) : (
              'not measurable until a read completes'
            )
          }
        />
        <div className="span">
          <span aria-hidden="true" />
          <span className="span-ann">
            <Window samples={ch2} sev={rowSev.heap} unit="%" decimals={0} what="Heap in use" />
          </span>
        </div>
      </div>

      <Gap />

      <div className="gut">03</div>
      <div className="cell">
        <Span
          label="pg round-trip"
          value={data && !dbLost ? read(data.database.latencyMs, 2) : null}
          unit="ms"
          sev={rowSev.trip}
          seq={seq}
          note={
            data ? (
              <>
                <b>{data.database.provider}</b> · {data.database.status} · measured by the service, not by
                this tab
              </>
            ) : (
              'not measurable until a read completes'
            )
          }
        />
        <div className="span">
          <span aria-hidden="true" />
          <span className="span-ann">
            <Window samples={ch1} sev={rowSev.trip} unit="ms" decimals={2} what="Postgres round-trip" />
          </span>
        </div>
      </div>

      <Gap />

      <div className="gut">04</div>
      <div className="cell">
        <Span
          label="active patients"
          value={data && !dbLost ? read(data.entities.activePatients, 0) : null}
          sev={rowSev.records}
          seq={seq}
          note={
            data && !dbLost ? (
              <>
                <b>{data.entities.activeUsers}</b> staff accounts · {data.entities.auditLogsCount} audit rows
                · soft-deleted rows excluded
              </>
            ) : (
              'not measurable while the Postgres connection is down'
            )
          }
        />
      </div>

      <Gap lg />

      {/* Both fault cases stay distinct: the read itself failing, and the
          service answering while its database round-trip does not. */}
      {fault && (
        <div className="cell cell-full" role="alert">
          <p className="note" data-sev="error">
            <span className="note-key">= note:</span> the read failed with <b>{fault}</b>, so nothing above
            was measured on this pass
          </p>
          <p className="note" data-sev="help">
            <span className="note-key">= help:</span> start the backend with{' '}
            <span className="code help-cmd">./run.sh dev</span> on port 3000, then read now
          </p>
          <p className="note" data-sev="note">
            <span className="note-key">= note:</span> the window above still holds the samples taken before
            the read failed
          </p>
        </div>
      )}

      {!fault && dbLost && (
        <div className="cell cell-full" role="alert">
          <p className="note" data-sev="error">
            <span className="note-key">= note:</span> the service answers, but the Postgres round-trip
            failed — round-trip and record counts are <b>not measurable</b> while the connection is down
          </p>
          <p className="note" data-sev="note">
            <span className="note-key">= note:</span> uptime and heap continue to be measured, so the two
            readings above them are still live
          </p>
        </div>
      )}

      {pollMs === 0 && !fault && (
        <div className="cell cell-full">
          <p className="note" data-sev="warn">
            <span className="note-key">= note:</span> reads are <b>held</b> — the values above are from the
            last read, not from now
          </p>
        </div>
      )}

      <div className="cell cell-full">
        <p className="note" data-sev="note">
          <span className="note-key">= note:</span> every value above is measured on read by the running
          process — there is no synthetic signal on this page
        </p>
        <p className="note" data-sev="note">
          <span className="note-key">= note:</span> the window holds the last {SAMPLE_WINDOW} samples only,
          so it is a live view and not a history; nothing here is retained across a reload
        </p>
      </div>
    </div>
  )
}
