import type { FC } from 'react'
import { ArrowDown, Info } from 'lucide-react'
import type { Telemetry } from '../App'
import { Screen } from './Screen'

interface Props {
  data: Telemetry | null
}

interface Layer {
  n: string
  name: string
  glob: string
  duty: string
}

/* Signal flow through the stack: a request enters at stage 1 and only the
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

export const BoundaryEnforcement: FC<Props> = ({ data }) => {
  const arch = data?.architecture

  return (
    <>
      <div className="head">
        <div className="head-t">
          <h2>Boundaries</h2>
          <span className="head-src">The layer contract this codebase is built to and checks against</span>
        </div>
        <span className="nom nom-xs">{arch ? arch.pattern : 'pattern unread'}</span>
      </div>

      <div className="two">
        <div className="col">
          <span className="nom nom-key">Signal path</span>
          <Screen graticule={false}>
            <div style={{ padding: 14 }}>
              <div className="stack">
                {LAYERS.map((l, i) => (
                  <div key={l.n}>
                    <div className="stage">
                      <span className="stage-n">{l.n}</span>
                      <div>
                        <div className="stage-name">{l.name}</div>
                        <div className="stage-glob">{l.glob}</div>
                        <p className="stage-duty">{l.duty}</p>
                      </div>
                    </div>
                    {i < LAYERS.length - 1 && (
                      <div className="flow" aria-hidden="true">
                        <span className="flow-line" />
                        <ArrowDown size={12} strokeWidth={2} />
                        <span className="nom nom-xs">passes to</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flow" aria-hidden="true" style={{ paddingLeft: 48 }}>
                <span className="flow-line" />
                <ArrowDown size={12} strokeWidth={2} />
                <span className="nom nom-xs">Prisma · {data?.database.provider ?? 'postgresql'}</span>
              </div>
            </div>
          </Screen>
        </div>

        <div className="col">
          <span className="nom nom-key">Enforced rules</span>
          <div className="rules">
            {RULES.map((r) => (
              <div className="rule" key={r.n}>
                <span className="rule-n">{r.n}</span>
                <span className="stage-name">{r.name}</span>
                <p className="prose-dim" style={{ margin: 0 }}>
                  {r.text}
                </p>
              </div>
            ))}
          </div>

          <fieldset className="blk">
            <legend>Declared status</legend>
            <div className="plate" data-tone="armed" style={{ marginBottom: 14 }}>
              <Info size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
              <span>
                <b>These two values are declarations, not results.</b> They are string constants in{' '}
                <code>src/routes/telemetry.route.ts</code>, so the telemetry read reports the policy this
                project holds itself to — it does not run the checkers. Only the commands below prove it, and
                they run as gates inside <code>bun run build</code>.
              </span>
            </div>

            <dl className="kv">
              <dt className="nom">Boundaries</dt>
              <dd className="val val-sm">{arch ? arch.boundariesStatus : '—'}</dd>
              <dt className="nom">API drift</dt>
              <dd className="val val-sm">{arch ? arch.apiDriftStatus : '—'}</dd>
              <dt className="nom">Versioning</dt>
              <dd className="val val-sm">{arch ? arch.versioning : '—'}</dd>
              <dt className="nom">Security</dt>
              <dd className="val val-sm">{arch ? arch.security : '—'}</dd>
            </dl>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="nom nom-xs">Run the checkers yourself</span>
              <code>bun run check:boundaries</code>
              <code>bun run check:api-drift</code>
            </div>
          </fieldset>
        </div>
      </div>

      <div className="plate">
        <Info size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
        <span>
          This project has never run in production and claims no compliance certification. The stack above
          describes enforced code structure — it is not a statement about HIPAA or GDPR conformance, neither
          of which is established here.
        </span>
      </div>
    </>
  )
}
