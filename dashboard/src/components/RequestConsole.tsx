import { useMemo, useState } from 'react'
import type { FC, ReactNode } from 'react'
import type { Sev } from '../App'

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

/** The probe point that is meant to fail. Its `error[404]` is the expected answer. */
const MISS = '/api/v1/patients/does-not-exist'

/** The only header this tab sets. Shown in the request block as source. */
const ACCEPT = 'accept: application/json'

interface Result {
  status: number
  statusText: string
  contentType: string
  bytes: number
  ms: number
  body: string
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

/* One line of the request, read the way rustc reads source: the line in the
   gutter, then a caret run struck under the span it annotates. `from` offsets
   the run in mono spaces, so it underlines the token and not the whole line. */
const Source: FC<{ n: string; line: string; from?: number; note: ReactNode }> = ({
  n,
  line,
  from = 0,
  note,
}) => (
  <>
    <div className="gut">{n}</div>
    <div className="cell">
      <span className="mono">{line}</span>
    </div>
    <div className="gut" aria-hidden="true" />
    <div className="cell">
      <span className="caret" data-sev="note">
        {`${' '.repeat(from)}${'^'.repeat(line.length - from)}`}
      </span>{' '}
      <span className="caret-note">{note}</span>
    </div>
  </>
)

export const RequestConsole: FC = () => {
  const [selected, setSelected] = useState(PRESETS[0].path)
  /** The path the held reading came from — not `selected`, which moves first. */
  const [probed, setProbed] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [fault, setFault] = useState<string | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  /** Probe counter. Changes on every completed probe, which re-strikes the carets. */
  const [seq, setSeq] = useState(0)

  const send = async (path: string) => {
    setSelected(path)
    setBusy(true)
    setFault(null)
    setRefusal(null)
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
      setProbed(path)
      setSeq((n) => n + 1)
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
      // The refusal is the clipboard's, not the service's, so it carries its own
      // row rather than being reported as a probe fault.
      setRefusal('clipboard was refused by the browser — select the body and copy manually')
    }
  }

  const bad = result ? result.status >= 400 : false

  /* Whether the body parsed as JSON. A pretty-printed body re-parses; the
     raw-text fallback does not, so this is read back rather than remembered. */
  const jsonBody = useMemo(() => {
    if (!result) return false
    try {
      JSON.parse(result.body)
      return true
    } catch {
      return false
    }
  }, [result])

  /* Severity is computed from the reading. `error` is the probe not completing
     or the service answering >= 400; a body that did not parse as JSON when
     JSON was asked for is `warn`; `help` is the state before any probe, where
     there is nothing measured and the reader has something to do. */
  const sev: Sev = fault ? 'error' : !result ? 'help' : bad ? 'error' : !jsonBody ? 'warn' : 'note'

  /* The real status code stands in the brackets, as an error code does in rustc. */
  const key = result ? `${sev}[${result.status}]` : sev
  const headline = fault
    ? ': the probe did not complete'
    : !result
      ? ': no probe has been sent from this tab yet'
      : bad
        ? ': the service answered with its error envelope'
        : !jsonBody
          ? ': the body did not parse as JSON, and is shown as raw text'
          : ': the service answered'

  const chosen = PRESETS.find((p) => p.path === selected)

  return (
    <div className="split-31">
      <div className="stack">
        <p className="span-label" id="probes-label">
          probe points
        </p>
        <div className="probes" role="group" aria-labelledby="probes-label">
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

        <div className="row">
          <button type="button" className="btn btn-hi" disabled={busy} onClick={() => void send(selected)}>
            {busy ? 'probing…' : 'probe again'}
          </button>
        </div>

        <p className="note" data-sev="note">
          <span className="note-key">= note:</span> {PRESETS.length} probe points — each one is a real GET
          sent from this browser tab against the running service, on the reader&rsquo;s click and never on a
          timer
        </p>
      </div>

      <div className="stack">
        {/* Block one: the request, as source. It carries no keyword line — the
            severity belongs to the answer, and the pair reads by its labels. */}
        <div className="diag">
          <div className="cell cell-full">
            <p className="span-label">request</p>
          </div>

          <Gap />

          <Source
            n="01"
            line={`GET ${selected}`}
            from={4}
            note={chosen ? <b>{chosen.note}</b> : 'the probe point selected on the left'}
          />

          <Gap />

          <Source
            n="02"
            line={ACCEPT}
            note="the only header this tab sets · same-origin fetch, no request body, no cache directive"
          />

          {selected === MISS && (
            <>
              <Gap />
              <div className="cell cell-full">
                <p className="note" data-sev="note">
                  <span className="note-key">= note:</span> this probe point is a <b>deliberate miss</b> — it
                  exists to show the real 404 shape, so the <span className="code">error[404]</span> below is
                  the expected answer and not a defect
                </p>
              </div>
            </>
          )}

          <Gap lg />
        </div>

        {/* Block two: the answer. */}
        <div className="diag">
          <div className="cell cell-full">
            <p className="span-label">response</p>
            <p className="sev" data-sev={sev} role="status">
              <span className="sev-key">{key}</span>
              <span className="sev-msg">{headline}</span>
            </p>
            <p className="prov">
              <span className="prov-arr" aria-hidden="true">
                --&gt;
              </span>
              {probed ? (
                <>
                  GET {probed}
                  {result ? (
                    <>
                      {' · '}
                      <b>{result.ms.toFixed(1)} ms</b> round-trip, timed in this tab
                    </>
                  ) : (
                    ' · no answer held'
                  )}
                </>
              ) : (
                'nothing sent yet — pick a probe point'
              )}
            </p>
          </div>

          <Gap />

          <div className="gut">01</div>
          <div className="cell">
            <Span
              label="status"
              value={result ? String(result.status) : null}
              sev={bad ? 'error' : 'note'}
              seq={seq}
              note={
                result ? (
                  <>
                    <b>{result.statusText || (bad ? 'error envelope' : 'ok')}</b> · the code the service
                    returned, carried here unmodified
                  </>
                ) : fault ? (
                  'no status — the request never reached a response'
                ) : (
                  'not measurable until a probe is sent'
                )
              }
            />
          </div>

          <Gap />

          <div className="gut">02</div>
          <div className="cell">
            <Span
              label="round-trip"
              value={result ? result.ms.toFixed(1) : null}
              unit="ms"
              seq={seq}
              note={
                result ? (
                  <>
                    measured in this tab with <span className="code">performance.now()</span>, so it includes
                    browser and network cost — <b>not a server-side figure</b>
                  </>
                ) : (
                  'not measurable until a probe completes'
                )
              }
            />
          </div>

          <Gap />

          <div className="gut">03</div>
          <div className="cell">
            <Span
              label="payload"
              value={result ? String(result.bytes) : null}
              unit="bytes"
              seq={seq}
              note={
                result
                  ? 'counted with TextEncoder over the exact text that came back — bytes, not characters'
                  : 'not measurable until a probe completes'
              }
            />
          </div>

          <Gap />

          <div className="gut">04</div>
          <div className="cell">
            <Span
              label="content-type"
              value={result && result.contentType !== 'unstated' ? result.contentType : null}
              sev={result && !jsonBody ? 'warn' : 'note'}
              seq={seq}
              note={
                !result
                  ? 'not readable until a probe completes'
                  : result.contentType === 'unstated'
                    ? 'the response stated no content-type header'
                    : jsonBody
                      ? 'the body parsed as JSON, and is pretty-printed below at two spaces'
                      : 'the body did not parse as JSON — it is printed below exactly as it came back'
              }
            />
          </div>

          <Gap lg />

          <div className="cell cell-full">
            <div className="row">
              <span className="span-label" id="body-label">
                response body
              </span>
              <span className="row-end">
                <button type="button" className="btn" onClick={() => void copy()} disabled={!result}>
                  {copied ? 'copied' : 'copy body'}
                </button>
              </span>
            </div>
            <pre className="pre" data-empty={!result} tabIndex={0} aria-labelledby="body-label">
              {result ? result.body : 'Pick a probe point to send a request.'}
            </pre>
          </div>

          {fault && (
            <div className="cell cell-full" role="alert">
              <p className="note" data-sev="error">
                <span className="note-key">= note:</span> the probe failed with <b>{fault}</b>, so nothing
                above was measured on this pass
              </p>
              <p className="note" data-sev="help">
                <span className="note-key">= help:</span> start the backend with{' '}
                <span className="code help-cmd">./run.sh dev</span> on port 3000, then probe again
              </p>
            </div>
          )}

          {refusal && (
            <div className="cell cell-full" role="alert">
              <p className="note" data-sev="error">
                <span className="note-key">= note:</span> {refusal} — the probe itself is unaffected
              </p>
            </div>
          )}

          {bad && result && (
            <div className="cell cell-full">
              <p className="note" data-sev="error">
                <span className="note-key">= note:</span>
                {probed === MISS ? ` HTTP ${result.status} is the expected answer here. ` : ' '}
                the body above is the service&rsquo;s real error envelope, carrying its{' '}
                <span className="code">code</span>, <span className="code">requestId</span> and{' '}
                <span className="code">path</span> — the same shape every failure returns
              </p>
            </div>
          )}

          {/* The caveat is stated twice on purpose: under the value it qualifies,
              and again here, where a reader who skipped the spans still meets it. */}
          <div className="cell cell-full">
            <p className="note" data-sev="warn">
              <span className="note-key">= note:</span> the round-trip above is measured{' '}
              <b>in this tab</b> with <span className="code">performance.now()</span> — it includes browser
              and network cost and is <b>not a server-side figure</b>. The service&rsquo;s own timing is the
              one on SVC-001.
            </p>
            <p className="note" data-sev="note">
              <span className="note-key">= note:</span> status, round-trip, payload and content-type are read
              from this one answer only — nothing here is averaged, and nothing is retained across a reload
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
