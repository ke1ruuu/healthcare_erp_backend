import { useRef } from 'react'
import type { FC, KeyboardEvent } from 'react'

export interface Detent {
  value: number
  legend: string
}

interface Props {
  /** Nomenclature engraved beside the control, e.g. "TIME / DIV". */
  label: string
  detents: Detent[]
  value: number
  onChange: (value: number) => void
}

/* A detented rotary control.

   It is a radiogroup underneath: each detent is a real radio, so screen
   readers announce "3 of 5" and arrow keys step positions natively. Clicking
   the knob body advances one detent, the way thumbing a real control does. */
export const Knob: FC<Props> = ({ label, detents, value, onChange }) => {
  const groupRef = useRef<HTMLDivElement | null>(null)
  const index = Math.max(0, detents.findIndex((d) => d.value === value))

  // Sweep the pointer across 260° of skirt, leaving the usual dead sector.
  const span = detents.length > 1 ? 260 / (detents.length - 1) : 0
  const angle = -130 + index * span

  const step = (delta: number) => {
    const next = Math.min(detents.length - 1, Math.max(0, index + delta))
    if (next === index) return
    onChange(detents[next].value)
    groupRef.current?.querySelectorAll<HTMLButtonElement>('.knob-pos')[next]?.focus()
  }

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') step(1)
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') step(-1)
    else if (event.key === 'Home') step(-detents.length)
    else if (event.key === 'End') step(detents.length)
    else return
    event.preventDefault()
  }

  return (
    <fieldset className="blk">
      <legend>{label}</legend>
      <div className="knob-set">
        <button
          type="button"
          className="knob"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => onChange(detents[(index + 1) % detents.length].value)}
        >
          <span className="knob-cap" />
          <span className="knob-mark" style={{ transform: `rotate(${angle}deg)` }} />
        </button>

        <div
          className="knob-dial"
          role="radiogroup"
          aria-label={label}
          ref={groupRef}
          onKeyDown={onKey}
        >
          {detents.map((d, i) => (
            <button
              key={d.value}
              type="button"
              role="radio"
              className="knob-pos"
              data-on={i === index}
              aria-checked={i === index}
              tabIndex={i === index ? 0 : -1}
              onClick={() => onChange(d.value)}
            >
              <span className="knob-tick" aria-hidden="true" />
              <span className="knob-legend">{d.legend}</span>
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  )
}
