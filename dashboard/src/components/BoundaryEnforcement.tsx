import { Fragment } from 'react'
import type { FC, ReactNode } from 'react'
import type { Sev, Telemetry } from '../App'

interface Props {
  data: Telemetry | null
}

interface Layer {
  n: string
  name: string
  glob: string
  duty: string
}

/* Signal flow through the stack: a request enters at stage 01 and only the
   final stage is permitted to touch the driver. */
const LAYERS: Layer[] = [
  {
    n: '01',
    name: 'Route',
    glob: 'src/modules/*/*.route.ts',
    duty: 'Declares method, path and version. Validates the request against a schema before anything downstream sees it.',
  },
  {
    n: '02',
    name: 'Controller',
    glob: 'src/modules/*/*.controller.ts',
    duty: 'Translates HTTP into an application call and formats the response envelope. Holds no business rules.',
  },
  {
    n: '03',
    name: 'Service',
    glob: 'src/modules/*/*.service.ts',
    duty: 'Owns business rules, orchestration and transaction boundaries. Knows nothing about HTTP.',
  },
  {
    n: '04',
    name: 'Repository',
    glob: 'src/modules/*/*.repository.ts',
    duty: 'The only stage permitted to touch Prisma. Applies the soft-delete filter so deleted rows never surface.',
  },
]

const RULES = [
  {
    n: 'R1',
    name: 'Single-writer ownership',
    text: 'Every table has exactly one owning module. No other module writes to it — cross-module changes go through the owner.',
  },
  {
    n: 'R2',
    name: 'Public module API',
    text: 'A module is reachable only through its barrel. Deep imports into another module’s internals are rejected.',
  },
  {
    n: 'R3',
    name: 'Unidirectional dependencies',
    text: 'Stages depend downward only. A repository never imports a service, and no import cycle is permitted.',
  },
  {
    n: 'R4',
    name: 'Shared kernel isolation',
    text: 'Code under shared/ imports nothing from modules/, so the kernel stays free of domain knowledge.',
  },
]

/** A blank gutter row. Paired so the gutter rule stays unbroken through it. */
const Gap: FC<{ lg?: boolean }> = ({ lg }) => (
  <>
    <div className={lg ? 'gut gap-lg' : 'gut gap'} aria-hidden="true" />
    <div className={lg ? 'cell gap-lg' : 'cell gap'} />
  </>
)

/* A value the route declares, with the caret run struck beneath it. Nothing on
   this panel was measured, so the annotation always states its severity keyword
   in words and says what the string actually is. The two rows share `--label-w`,
   which is what lands the caret under the value it annotates. */
const Declared: FC<{
  label: string
  value: string | undefined
  sev: Sev
  note: ReactNode
}> = ({ label, value, sev, note }) => {
  const missing = value === undefined
  const display = missing ? '—' : value
  const rowSev: Sev = missing ? 'error' : sev

  return (
    <>
      <div className="span">
        <span className="span-label">{label}</span>
        <span className={missing ? 'span-val dash' : 'span-val'} data-sev={rowSev}>
          {display}
        </span>
      </div>
      <div className="span">
        <span aria-hidden="true" />
        <span className="span-ann" data-sev={rowSev}>
          <span className="caret">{'^'.repeat(display.length)}</span>{' '}
          <span className="caret-note">
            <span className="note-key">{rowSev}:</span>{' '}
            {missing ? 'not read — the route has not answered on this pass' : note}
          </span>
        </span>
      </div>
    </>
  )
}

export const BoundaryEnforcement: FC<Props> = ({ data }) => {
  const arch = data?.architecture

  /* A permanent `warn`, and the reason sits in the source rather than in the
     read: two of the statuses the route returns are string literals. A completed
     read cannot clear it, and a failed read cannot make it worse. */
  const pageSev: Sev = 'warn'

  return (
    <div className="diag">
      <div className="cell cell-full">
        <p className="sev" data-sev={pageSev} role="status">
          <span className="sev-key">{pageSev}</span>
          <span className="sev-msg">
            {arch
              ? ': two of the statuses below are declared, not verified'
              : ': no reading yet — the statuses below are declarations either way'}
          </span>
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
        </p>
      </div>

      <Gap lg />

      <div className="cell cell-full">
        <h2 className="span-label">signal path</h2>
      </div>

      <Gap />

      {LAYERS.map((l, i) => (
        <Fragment key={l.n}>
          <div className="gut">{l.n}</div>
          <div className="cell">
            <p className="caret-note">
              <b>{l.name}</b>
            </p>
            <p className="prov">
              <span className="prov-arr" aria-hidden="true">
                --&gt;
              </span>
              {l.glob}
            </p>
            <p className="caret-note">{l.duty}</p>
          </div>

          {/* The downward run, in the mono face and in words — this world has no
              icons, so the direction is stated as well as drawn. */}
          <div className="gut" aria-hidden="true" />
          <div className="cell">
            <span className="caret" aria-hidden="true">
              v
            </span>{' '}
            <span className="caret-note">
              {i < LAYERS.length - 1 ? (
                `passes to ${LAYERS[i + 1].n} ${LAYERS[i + 1].name}`
              ) : (
                <>
                  reaches Prisma ·{' '}
                  {data ? (
                    <b className="mono">{data.database.provider}</b>
                  ) : (
                    <span className="dash">—</span>
                  )}
                </>
              )}
            </span>
          </div>

          <Gap />
        </Fragment>
      ))}

      <div className="cell cell-full">
        <p className="note" data-sev="note">
          <span className="note-key">= note:</span> a request enters at <b>01</b> and runs down. A stage
          calls the stage below it and never the one above, so the dependency direction is one way — that is
          rule <span className="code">R3</span>.
        </p>
      </div>

      <Gap lg />

      <div className="cell cell-full">
        <h2 className="span-label">enforced rules</h2>
      </div>

      <Gap />

      {RULES.map((r) => (
        <Fragment key={r.n}>
          <div className="gut" aria-hidden="true" />
          <div className="cell">
            <p className="caret-note">
              <b className="code">{r.n}</b> <b>{r.name}</b>
            </p>
            <p className="caret-note">{r.text}</p>
          </div>
          <Gap />
        </Fragment>
      ))}

      <Gap />

      <div className="cell cell-full">
        <h2 className="span-label">declared status</h2>
        <p className="prov">
          <span className="prov-arr" aria-hidden="true">
            --&gt;
          </span>
          src/routes/telemetry.route.ts
        </p>
      </div>

      <Gap />

      <div className="gut" aria-hidden="true" />
      <div className="cell">
        <Declared
          label="boundaries"
          value={arch?.boundariesStatus}
          sev="warn"
          note="declared policy — the route returns this string whether or not the checker has ever run"
        />
      </div>

      <Gap />

      <div className="gut" aria-hidden="true" />
      <div className="cell">
        <Declared
          label="api drift"
          value={arch?.apiDriftStatus}
          sev="warn"
          note="declared policy — the same string on every read; no contract check runs during a read"
        />
      </div>

      <Gap />

      <div className="gut" aria-hidden="true" />
      <div className="cell">
        <Declared
          label="versioning"
          value={arch?.versioning}
          sev="note"
          note="a description of the routing scheme this project holds to, not a check result"
        />
      </div>

      <Gap />

      <div className="gut" aria-hidden="true" />
      <div className="cell">
        <Declared
          label="security"
          value={arch?.security}
          sev="note"
          note="a description of the posture the route declares, not a check result"
        />
      </div>

      <Gap />

      <div className="gut" aria-hidden="true" />
      <div className="cell">
        <Declared
          label="pattern"
          value={arch?.pattern}
          sev="note"
          note="the shape this codebase is built to, as the route states it"
        />
      </div>

      <Gap />

      {/* The plate this whole check exists for: the two statuses above claim a
          result, and no result was produced to back them. */}
      <div className="cell cell-full">
        <p className="note" data-sev="warn">
          <span className="note-key">= note:</span> <b>These two values are declarations, not results.</b>{' '}
          They are string constants in <span className="code">src/routes/telemetry.route.ts</span>, so the
          telemetry read reports the policy this project holds itself to — it does not run the checkers.
          Only the commands below prove it.
        </p>
        <p className="note" data-sev="help">
          <span className="note-key">= help:</span> <span className="code help-cmd">bun run check:boundaries</span>{' '}
          walks every import under <span className="code">src/</span> and reports the ones that cross a
          module boundary
        </p>
        <p className="note" data-sev="help">
          <span className="note-key">= help:</span> <span className="code help-cmd">bun run check:api-drift</span>{' '}
          reads the OpenAPI contract and reports the changes that would break v1
        </p>
        <p className="note" data-sev="note">
          <span className="note-key">= note:</span> both run as gates inside{' '}
          <span className="code">bun run build</span>, so a violation fails the build — nothing on this page
          runs them
        </p>
      </div>

      {!arch && (
        <div className="cell cell-full">
          <p className="note" data-sev="error">
            <span className="note-key">= note:</span> the telemetry read has not completed, so the five
            declared values above are <b>unread</b> — they are declarations in the route either way
          </p>
        </div>
      )}

      <Gap />

      <div className="cell cell-full">
        <p className="note" data-sev="note">
          <span className="note-key">= note:</span> the layers and rules on this page are constants held by
          this dashboard, transcribed from the codebase — they are not read from the service and do not
          change with a read
        </p>
        <p className="note" data-sev="note">
          <span className="note-key">= note:</span> this project has never run in production and claims no
          compliance certification
        </p>
        <p className="note" data-sev="note">
          <span className="note-key">= note:</span> the contract above describes enforced code structure —
          it is not a statement about <b>HIPAA</b> or <b>GDPR</b> conformance, neither of which is
          established here
        </p>
      </div>
    </div>
  )
}
