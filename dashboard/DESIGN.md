# DESIGN.md — Reading Panel

The visual world of the Healthcare ERP Backend monitoring dashboard (`dashboard/`).
Written from the built surface, not from a plan.

---

## The direction

The locked contract lives as an HTML comment in `dashboard/index.html` so it survives the
production build. In full:

- **Thesis** — A backend read the way a radiologist reads a study: one bright panel in a dark
  room, technique burned into the corners. It refuses the glowing-metric-card observability
  dashboard and its cyan-on-near-black rut.
- **Own world** — Warm-dark reading-room surround; a genuinely luminous film-base panel as the
  only light source; an 11-step density wedge as the data scale; lead-marker red and darkroom
  safelight amber as the only colours; square corners, hairline collimation borders; Archivo
  (`wght` + `wdth` axes) with Azeret Mono carrying every measured value.
- **Story** — A stakeholder sees a live healthy service, real records, a working request console,
  and layered enforced architecture, and trusts the engineering without reading the source.
- **First viewport** — Left worklist rail of four studies; the selected study lit on the panel
  bank at right; system technique burned into the panel's four corners; Postgres round-trip
  latency plotted as a film trace under a density wedge.
- **Form** — PACS reading panel; candidate 6 of 7; seed `21f5e344`.

The metaphor is load-bearing, not decorative. A radiology reading station is the one interface
whose whole job is *making measured evidence legible and trustworthy* — which is exactly this
dashboard's job. Every element earns its place by that mapping: the worklist is a worklist, the
burned-in corners are provenance, the density wedge is a calibration scale, the trace is a
recording.

## The room and the panel

The page is two materials and nothing else.

**The room** (`--room #14100c` through `--room-edge #2c251c`) is warm-dark, not blue-dark. A
fixed `body::before` lays a faint radial lift and a top/bottom falloff so the surround reads as a
space lit by the panel rather than as a flat dark background. Chrome lives here: the identity, the
poll control, the lamp, the worklist, the footer.

**The panel** (`--panel #e6eae6`, core `--panel-core #f1f4ef`, sink `--panel-sink #d5dad4`) is the
only light source. It gets a radial `background-image` so the centre is brighter than the edges —
a light box, not a white rectangle — plus two shadows: `--lift` (an ordinary offset drop shadow,
`0 18px 44px -12px`) to seat it in the room, and `--emit` (a large soft ambient bloom) to make it
appear to *emit*. Two `::before`/`::after` pseudo-elements draw the collimation edge (a 1px inset
hairline) and the four corner collimation ticks.

Type is scoped to the material. On the room, `--room-ink #d9cfc0`; on the panel, `--ink #16130f`.
Nothing borrows the other's palette.

## Colour discipline

Two hues, each with a room variant and a panel variant, because contrast is not transferable:

| Token | Value | Used on | Contrast |
|---|---|---|---|
| `--marker` | `#b4231c` | the lit panel | 5.41:1 on `#e6eae6` |
| `--marker-lit` | `#e8564a` | the dark room | 5.33:1 on `#14100c` |
| `--safelight` | `#d4791b` | fills, dots | 5.92:1 on the room |
| `--safelight-lit` | `#e9a144` | room text | passes AA |

The first attempt used `--marker` everywhere. On the room it computed to **2.91:1** — a body-text
failure. `--marker-lit` exists solely to fix that, and the split is now a rule of the world: red
on the panel is `--marker`, red on the room is `--marker-lit`.

Amber is the safelight: it marks *live* (the polling lamp, the active study's accession, advisory
notices). Red is the lead marker: it marks *the thing you are looking at* and *the thing that went
wrong* (active study rail, sort direction, the trace itself, faults, 4xx/5xx status).

`--d00` … `--d10` are an 11-step neutral ramp from `#f1f4ef` to `#171916`. They are the world's
quantitative scale, not a decoration.

## Type

Two variable families, each with one job.

**Archivo** (`wdth 62–125`, `wght 300–800`) carries language. Study titles run at a narrowed,
heavy setting (`'wdth' 88, 'wght' 760`) so they read as stamped labels rather than marketing
headlines. Body prose sits at `--ink-2` and is capped at `68ch` (`.prose`).

**Azeret Mono** carries every measured value, without exception: latencies, MRNs, dates, byte
counts, HTTP statuses, response bodies, the burned-in technique, the axis labels, the pagination
meta. The rule is a semantic one — *if it was measured, it is monospaced* — which is why `.val`
exists as a utility and why mono is never used for prose. The number `01:16:16` and the number
`0.62` line up because `font-variant-numeric: tabular-nums` is on.

Uppercase mono at wide tracking is the world's label voice (`.film-sub`, `.legend`, `.burn`,
`.field-label`, `.readout-k`, table headers). Sentence-case Archivo is its speaking voice.

## The four studies

The worklist is a real worklist: accession code, name, and a one-line note per study. Arrow keys
step it (`role="tablist"`, roving `tabIndex`, `aria-current`), the way a reading station steps
studies.

- **SVC-001 Service vitals** — uptime, heap, Postgres round-trip, active record counts; the
  latency trace; two density wedges.
- **REC-002 Master records** — patients and staff accounts, with server-resolved paging, sorting,
  and search; inline patient registration.
- **REQ-003 Request console** — real timed calls against the running service, including a
  deliberate 404 so the error envelope is visible next to a success.
- **BND-004 Boundary enforcement** — the four layers, the four enforced rules, and the two
  declared governance statuses.

## Two authored instruments

**The density wedge** (`ServiceVitals.tsx`) renders the `--d00…--d10` ramp as eleven steps with a
lead-red pointer under the step a live value falls on. First build shipped it without step
outlines: `--d00` and `--d01` are close enough to the panel that they vanished, so the wedge
appeared to start at step 3 and the `0%` label looked misaligned. Each step now carries a
`inset 0 0 0 1px rgb(22 19 15 / 0.16)` hairline, and all eleven read.

**The film trace** is a hand-built SVG polyline of the last 48 Postgres round-trip readings: a
five-line graticule in `--panel-edge`, the trace in `--marker`, a dashed vertical marker on the
most recent reading, and a labelled axis column (ceiling / midpoint / zero) in mono. It replaced a
canvas sparkline with a cyan gradient. First build shipped without the axis, which left the
graticule meaningless — a chart with gridlines and no scale. There is no charting library in this
project and none was added.

## Motion

One authored moment. Selecting a study runs `illuminate` on `.film` — 420ms,
`cubic-bezier(0.16, 1, 0.3, 1)`, from `opacity 0.35` + `translateY(7px)` + `blur(1.5px)` to
resting. It is the film coming up on the light box. It is gated behind
`@media (prefers-reduced-motion: no-preference)`, and the only other motion in the world is the
refresh icon's spin while a read is in flight.

## States

Every surface that can fail, wait, or be empty says so in the world's own voice:

- **Live / lost** — the header lamp switches from safelight amber to `--marker-lit`, with matching
  copy ("Panel live" / "Signal lost").
- **Fault** — `.notice-fault` carries the API's own message plus the command that would fix it
  (`./run.sh dev`). Postgres unreachable is a distinct notice from telemetry unreachable, because
  they are distinct failures: the service can be up while the database round-trip is not
  measurable.
- **Loading** — "Reading patients…" in the table body; "Reading" on the refresh control; controls
  disable rather than vanish.
- **Empty** — distinguishes *no match for this search* from *no records at all*, and the latter
  names the fix (`bun run db:seed`).
- **Not yet measurable** — the trace says "Trace builds from the second reading" rather than
  drawing a single meaningless point. Values that cannot be measured render as an em dash, never
  as `0`.
- **Rejected** — the registration form surfaces the API's per-field Zod errors verbatim.

## Refusals

Recorded because they were live temptations:

- No metric cards with big coloured numbers over a glass blur. The `.readout` strip is one
  hairline-divided band of four measurements, sharing a single frame.
- No same-size card grid as page structure. The panel is one field; content inside it is a
  sequence of instruments with real hierarchy.
- No modal for patient registration. It is an inline form on the film — the task needs neither
  interruption nor protected focus.
- No gradient text, no glass, no rounded corners, no coloured left borders wider than a hairline,
  no kicker/eyebrow above any heading, no emoji standing in for icons.
- No monospace as costume: mono means measured.
- No charting library, no CSS framework, no component library — a PRODUCT.md constraint, kept.
- No invented data. Everything on the panel is fetched or absent.

## Honesty

`GET /api/v1/telemetry` returns `architecture.boundariesStatus` and `architecture.apiDriftStatus`
as **hardcoded strings** (`src/routes/telemetry.route.ts:78-79`) — they are not derived from
running `scripts/check-boundaries.ts` or `scripts/check-api-drift.ts`.

BND-004 therefore presents them as *declared policy plus the command that would prove it*, under
an explicit notice saying the route returns static strings and that this panel's copy is not
authoritative. No green checkmark, no "verified" badge, no synthesised pass count. Wiring those
scripts into the telemetry route is a backend change and is not part of this build.

Everything else on the panel is measured: uptime, memory, Postgres round-trip latency, telemetry
probe time, entity counts (all respecting `deletedAt: null`), request timings in the console, and
the pagination `meta` under every table.

## Accessibility

WCAG AA on both materials, verified per pairing rather than assumed — the `--marker` /
`--marker-lit` split exists because of it. Beyond contrast: `role="tablist"` with arrow-key
traversal and roving focus on the worklist; `aria-current` and `aria-selected` on studies;
`aria-sort` on sortable table headers with `<caption>` in `.sr`; `role="alert"` on faults and
`role="status"` on the lamp and confirmations; `aria-label` on the trace describing the reading in
words; labelled controls throughout; a global `:focus-visible` ring that switches colour per
material; `prefers-reduced-motion` respected.

`.field input`, `.field select`, and `.field textarea` pin `color-scheme: light`. Without it, the
document's `<meta name="color-scheme" content="dark">` made the UA paint dark native controls
directly on the lit panel — the first build's worst visual bug.

## Files

```
dashboard/
  index.html                  ← the direction contract (comment), fonts, color-scheme
  public/favicon.svg          ← dark room, lit panel, four wedge steps, lead marker
  src/
    index.css                 ← the entire world: tokens, materials, instruments, responsive
    App.tsx                   ← room shell, polling, worklist, panel, burned-in technique
    components/
      ServiceVitals.tsx       ← readouts, film trace, density wedges
      MasterRecords.tsx       ← paged/sorted/searched sheets, inline registration
      RequestConsole.tsx      ← timed live requests, response envelope
      BoundaryEnforcement.tsx ← layers, rules, declared governance
```

Deleted in this build: `Navbar.tsx`, `VitalsOverview.tsx`, `DomainExplorer.tsx`,
`ApiWorkbench.tsx`, `ArchitectureGuard.tsx`, `App.css`, and the Vite scaffold assets
(`src/assets/*`, `public/vite.svg`).

## Responsive

Three breakpoints, each a real change of arrangement rather than a shrink.

- **≤1080px** — the rail narrows to 216px, the film's padding tightens.
- **≤880px** — the bank goes single-column and the worklist becomes a 4-up strip above the panel.
  The burned-in technique leaves the corners and becomes a two-column strip *below* the film, so a
  phone reads the study first and the provenance second. Tables get `min-width: 760px` inside an
  `overflow-x: auto` container so columns stay intact and scroll, instead of crushing an MRN into
  three lines.
- **≤560px** — the worklist becomes 2×2 (all four studies stay reachable without scrolling), the
  readout strip reflows.

## Verification

- `bun run build` — clean (`tsc -b && vite build`).
- `impeccable` anti-pattern detector over `index.css` and all five TSX files — **zero findings**.
- Inspected at 1440×900 and 390×844 across all four studies plus the registration form and the
  404 response, against the live backend with Postgres connected.

Two things the environment could not provide: no image generation is available on this machine, so
the comp-visualisation step was skipped and the world was built directly from the contract; and
the detector had to be invoked manually rather than by hook.
