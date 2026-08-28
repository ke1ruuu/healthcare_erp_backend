import type { FC } from 'react'

/* Authored seven-segment display.

   Geometry is real bar-and-chamfer segment art on a 116x170 field, slanted 5°
   the way an LED module is. Unlit segments stay drawn at low value so the
   display reads as a physical part with a fixed digit grid, not as a font. */

const T = 16 // segment thickness
const HALF = T / 2

/** A horizontal bar: chamfered tips, centred on cy, spanning x0..x1. */
function hbar(cy: number, x0: number, x1: number): string {
  return [
    `${x0},${cy}`,
    `${x0 + HALF},${cy - HALF}`,
    `${x1 - HALF},${cy - HALF}`,
    `${x1},${cy}`,
    `${x1 - HALF},${cy + HALF}`,
    `${x0 + HALF},${cy + HALF}`,
  ].join(' ')
}

/** A vertical bar: chamfered tips, centred on cx, spanning y0..y1. */
function vbar(cx: number, y0: number, y1: number): string {
  return [
    `${cx},${y0}`,
    `${cx + HALF},${y0 + HALF}`,
    `${cx + HALF},${y1 - HALF}`,
    `${cx},${y1}`,
    `${cx - HALF},${y1 - HALF}`,
    `${cx - HALF},${y0 + HALF}`,
  ].join(' ')
}

const SEGMENTS: Record<string, string> = {
  a: hbar(8, 22, 78),
  b: vbar(89, 18, 75),
  c: vbar(89, 95, 152),
  d: hbar(162, 22, 78),
  e: vbar(11, 95, 152),
  f: vbar(11, 18, 75),
  g: hbar(85, 22, 78),
}

const ORDER = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const

const GLYPHS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  '-': 'g',
  ' ': '',
}

const TONE: Record<string, string> = {
  phos: 'var(--phos-hot)',
  amber: 'var(--amber)',
  warn: 'var(--warn-rule)',
  ch2: 'var(--ch2-trace)',
  off: 'var(--ink-3)',
}

const Digit: FC<{ char: string }> = ({ char }) => {
  const lit = GLYPHS[char] ?? ''
  return (
    <svg className="seg-svg" viewBox="0 0 116 170" aria-hidden="true" focusable="false">
      <g transform="translate(15,0) skewX(-5)">
        {ORDER.map((s) => (
          <polygon key={s} points={SEGMENTS[s]} className={lit.includes(s) ? 'seg-on' : 'seg-off'} />
        ))}
      </g>
    </svg>
  )
}

/** Decimal point and colon are their own narrow cells, as on a real module. */
const Punct: FC<{ char: '.' | ':' }> = ({ char }) => (
  <svg className="seg-svg" viewBox="0 0 36 170" aria-hidden="true" focusable="false">
    <g transform="translate(6,0) skewX(-5)">
      {char === '.' ? (
        <rect x="4" y="152" width="18" height="18" className="seg-on" />
      ) : (
        <>
          <rect x="4" y="46" width="18" height="18" className="seg-on" />
          <rect x="4" y="106" width="18" height="18" className="seg-on" />
        </>
      )}
    </g>
  </svg>
)

interface Props {
  /** Characters to display: digits, '-', '.', ':' and ' ' for a dark cell. */
  value: string
  /** Plain-language reading for assistive technology. */
  label: string
  unit?: string
  tone?: 'phos' | 'amber' | 'warn' | 'ch2' | 'off'
  /** Display height in px; the digit grid scales from it. */
  height?: number
}

export const SevenSegment: FC<Props> = ({ value, label, unit, tone = 'phos', height = 40 }) => (
  <div
    className="segline"
    role="img"
    aria-label={unit ? `${label}: ${value} ${unit}` : `${label}: ${value}`}
    style={{ ['--seg-h' as string]: `${height}px`, ['--seg-c' as string]: TONE[tone] }}
  >
    {value.split('').map((char, i) =>
      char === '.' || char === ':' ? (
        <Punct key={i} char={char} />
      ) : (
        <Digit key={i} char={char} />
      )
    )}
    {unit && (
      <span className="seg-unit" aria-hidden="true">
        {unit}
      </span>
    )}
  </div>
)
