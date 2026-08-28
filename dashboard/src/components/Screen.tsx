import type { FC, ReactNode } from 'react'

/* The etched graticule: ten horizontal divisions by eight vertical, with
   0.2-division ticks along both centre axes, exactly as it is scored into
   the faceplate of a bench scope. Drawn behind everything on the glass and
   used as the real measuring reference for the traces. */

const DIVS_X = 10
const DIVS_Y = 8
const W = 1000
const H = 800

export const Graticule: FC = () => {
  const cols = Array.from({ length: DIVS_X - 1 }, (_, i) => (i + 1) * (W / DIVS_X))
  const rows = Array.from({ length: DIVS_Y - 1 }, (_, i) => (i + 1) * (H / DIVS_Y))
  const subX = Array.from({ length: DIVS_X * 5 - 1 }, (_, i) => (i + 1) * (W / (DIVS_X * 5)))
  const subY = Array.from({ length: DIVS_Y * 5 - 1 }, (_, i) => (i + 1) * (H / (DIVS_Y * 5)))

  return (
    <svg
      className="gratic"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="var(--gratic)" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {cols.map((x) => (
          <line key={`c${x}`} x1={x} y1="0" x2={x} y2={H} vectorEffect="non-scaling-stroke" />
        ))}
        {rows.map((y) => (
          <line key={`r${y}`} x1="0" y1={y} x2={W} y2={y} vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      {/* Centre axes carry the fine ticks — the part you actually measure against. */}
      <g stroke="var(--gratic-maj)" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <line x1={W / 2} y1="0" x2={W / 2} y2={H} vectorEffect="non-scaling-stroke" />
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} vectorEffect="non-scaling-stroke" />
        {subX.map((x) => (
          <line
            key={`sx${x}`}
            x1={x}
            y1={H / 2 - 6}
            x2={x}
            y2={H / 2 + 6}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {subY.map((y) => (
          <line
            key={`sy${y}`}
            x1={W / 2 - 6}
            y1={y}
            x2={W / 2 + 6}
            y2={y}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  )
}

interface ScreenProps {
  children: ReactNode
  className?: string
  /** Set false for glass that carries text rather than a measured trace. */
  graticule?: boolean
}

/** CRT glass: a dark tube face, an etched graticule, veiling glare over the top. */
export const Screen: FC<ScreenProps> = ({ children, className, graticule = true }) => (
  <div className={className ? `screen ${className}` : 'screen'}>
    {graticule && <Graticule />}
    <div className="screen-in">{children}</div>
  </div>
)
