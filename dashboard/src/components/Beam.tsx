import { useEffect, useRef } from 'react'
import type { FC } from 'react'

/* The beam.

   Two signals are traced in roll mode across the graticule: the newest sample
   enters at the right and the whole waveform walks left, which is what a slow
   timebase genuinely does. Between polls the roll is interpolated so the walk
   is continuous rather than a per-sample jump — the motion represents elapsed
   time, it does not invent data.

   Both channels are the same P31 phosphor. They separate by POSITION — CH1
   above the centre axis, CH2 below it — and by intensity, never by hue. Older
   samples are dimmer because phosphor decays, so the trace shows you the age
   of what you are looking at.

   The graticule underneath is the measuring reference: CH1 is drawn at a real
   ms/div and CH2 at a real %/div, both reported on the tube. */

export const TRACE_WINDOW = 60 // 10 divisions at 6 samples per division

/** Attenuator steps, as a real front panel has them. */
const STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]

/** Pick the smallest 1-2-5 step that keeps the peak inside `divs` divisions. */
export function pickScale(peak: number, divs: number): number {
  const needed = peak / divs
  return STEPS.find((s) => s >= needed) ?? STEPS[STEPS.length - 1]
}

interface Props {
  ch1: number[]
  ch2: number[]
  msPerDiv: number
  pctPerDiv: number
  /** Poll interval in ms; 0 when held, which stops the roll. */
  pollMs: number
  /** False when the trigger is lost — the beam stops being re-armed. */
  live: boolean
}

interface Chan {
  data: number[]
  perDiv: number
  /** Graticule row the trace sits on, 0 at the top, 8 at the bottom. */
  baseDiv: number
  color: string
  width: number
}

export const Beam: FC<Props> = ({ ch1, ch2, msPerDiv, pctPerDiv, pollMs, live }) => {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const arrivedAt = useRef(0)
  const lastLen = useRef(0)
  const chans = useRef<{ ch1: number[]; ch2: number[] }>({ ch1, ch2 })

  chans.current = { ch1, ch2 }

  // Stamp when a fresh sample landed, so the roll can interpolate from it.
  if (ch1.length !== lastLen.current) {
    lastLen.current = ch1.length
    arrivedAt.current = performance.now()
  }

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const styles = getComputedStyle(canvas)
    const hot = styles.getPropertyValue('--phos-hot').trim() || '#39ff14'
    const trace1 = styles.getPropertyValue('--phos').trim() || '#5bf43a'
    const trace2 = styles.getPropertyValue('--ch2-trace').trim() || '#2fd38c'

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    const stroke = (chan: Chan, shift: number) => {
      const { data, perDiv, baseDiv, color, width } = chan
      if (data.length < 2) return

      const divW = w / 10
      const divH = h / 8
      const baseY = baseDiv * divH
      // Newest sample sits at the right edge; the window walks left by `shift`.
      const x = (i: number) => w - (data.length - 1 - i + shift) * (divW / 6)
      const y = (v: number) => baseY - (v / perDiv) * divH

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.lineWidth = width

      // Segment-by-segment so intensity can decay with sample age.
      for (let i = 1; i < data.length; i += 1) {
        const age = 1 - i / data.length
        ctx.globalAlpha = 0.2 + 0.8 * Math.pow(1 - age, 1.35)
        ctx.strokeStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 6 * (1 - age) + 1
        ctx.beginPath()
        ctx.moveTo(x(i - 1), y(data[i - 1]))
        ctx.lineTo(x(i), y(data[i]))
        ctx.stroke()
      }

      // The beam head: the sample being written right now.
      const last = data.length - 1
      ctx.globalAlpha = 1
      ctx.fillStyle = hot
      ctx.shadowColor = hot
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(x(last), y(data[last]), 2.6, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }

    const draw = (now: number) => {
      const { ch1: a, ch2: b } = chans.current
      ctx.clearRect(0, 0, w, h)

      // Roll interpolation: fraction of a sample-width travelled since arrival.
      const elapsed = now - arrivedAt.current
      const shift = still || !live || pollMs <= 0 ? 0 : Math.min(1, elapsed / pollMs)

      stroke({ data: a, perDiv: msPerDiv, baseDiv: 4, color: trace1, width: 1.7 }, shift)
      stroke({ data: b, perDiv: pctPerDiv, baseDiv: 8, color: trace2, width: 1.4 }, shift)

      if (!still) raf = requestAnimationFrame(draw)
    }

    if (still) {
      // No roll, no re-arming — one honest redraw of the current window.
      draw(performance.now())
    } else {
      raf = requestAnimationFrame(draw)
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [msPerDiv, pctPerDiv, pollMs, live, ch1.length, ch2.length])

  return <canvas className="beam" ref={ref} aria-hidden="true" />
}
