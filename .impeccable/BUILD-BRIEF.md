# Build brief — dashboard visual world replacement

**Status:** build IN PROGRESS — CSS spine and favicon done, contract/shell/panels remain. **Read "Resume state" at the bottom of this file first.**
**Seed key:** `efa2b6fa` · **Scope:** direction · **Mode:** operate
**Chosen:** `{"optionId":"assigned","steer":""}` — the assigned card, taken as dealt, no steer.
**Skill base dir:** `/Users/keiru/.claude/skills/impeccable` (NOT vendored in this repo — always use the absolute path for scripts).

---

## The brief, from the user

> "Redesign the whole dashboard monitoring into more modern and cool design. Remove any AI slops designs here, and redesign it as a whole depends on your satisfaction."

Four structured answers that sharpen it:

1. **No object metaphor at all.** Stop dressing the dashboard as some other object. Build a screen that is confidently a screen.
2. **It would feel wrong if it looked like every other dashboard, and wrong if it played safe.** Both. No Grafana/Vercel/shadcn defaults — no rounded tiles, no zinc borders, no gradient sparklines, no cyan/violet accent.
3. **Visual world only.** Every panel, function, state and honesty notice survives intact. The look, layout language, type and colour are fully replaced.
4. Impeccable updated to v4.1.1 (already done).

Effort level for the session was `ultracode` (xhigh + dynamic workflow orchestration).

---

## The world: "Checked"

**Lineage.** The compiler diagnostic — rustc and tsc error reports, read as a designed publication rather than terminal output.

**Thesis.** The backend reports itself the way a type-checker reports code: every number is a span with a caret drawn under it, a source path printed above it, and a severity computed from the reading rather than chosen by the designer. It refuses the metric-card grid outright — there is no card to put a number in. A diagnostic is not an object; it is the graphic this audience reads more often than anything except their own code.

**Why it beat the challengers.** It is the only card on the table with no costume in it. Cyclorama (stage lighting) and Shoebox Stack (HyperCard) were competitive but both lose on audience identification and product clarity — Cyclorama's most common state is the near-black rut, and Shoebox Stack's one-bit palette structurally cannot carry severity, which a monitoring surface may not drop. Slide Rack was declined; its **single-type-size discipline was kept** and carried into this world in weaker form: the diagnostic runs on two sizes, not seven, with rank carried by weight, case and rule.

**The risk to steer against, verbatim from the card.** "Set in mono on a dark ground this becomes a terminal skin — precisely the costume you just rejected. It survives only as a publication: bright ground, Chivo carrying language, mono reserved strictly for what was measured, and severity as the only colour on the page. Set timidly it reads as a log file."

### Ground: light. Not negotiable.

Forced by the physical scene: a developer in a lit room with an editor open beside this, and a reviewer at a laptop or on a projector. A dark page washes out under projection. Light ground is also the single strongest defence against the terminal-skin failure mode.

### Palette — severity is the ONLY chroma

| Token | Hex | Duty |
|---|---|---|
| ground | `#DEE2DD` | page field |
| sheet | `#F4F6F2` | the bright diagnostic sheet |
| ink | `#0A2320` | petrol — all type, all rules, the `note` severity, the full-height left field |
| error | `#D62511` | vermilion — fault states only |
| help | `#1B4FD0` | cobalt — `= help:` rows, commands the reader can run |
| warning | `#8F6100` | ochre — declared-not-verified, BND-004 |

Nothing else carries colour. No accent, no brand hue, no decorative tint. Severity is computed from live telemetry — never chosen. Colour is never the sole signal: every severity also carries its keyword in words.

### Type — one designed superfamily, two rhythms

- **Chivo** (300–900 + italic) for all language.
- **Chivo Mono** (300–700) for every measured value, every path, every code fragment.

Neither face is on new-work.md's banned-defaults list. This preserves the project's established rule: **if it was measured, it is monospaced.** Two sizes for the diagnostic body, rank by weight/case/rule (the kept Slide Rack idea).

### Structure

- **No header. No cards. Zero borders, zero shadows, zero radius.** Hairline rules only.
- **Full-height petrol field down the left** = the check list. Four checks by code and live severity: `SVC-001 note`, `REC-002 note`, `REQ-003 note`, `BND-004 warn`. This is the tablist — it replaces the old rail and must keep the roving-tabindex keyboard behaviour exactly.
- **BND-004 sits at `warn` permanently**, and that is correct: the telemetry route really does hardcode two of its statuses. Honest, and it will look like a defect until the reader reaches the plate explaining why. Do not soften it.
- **The body is one large diagnostic block on the bright sheet**: severity keyword set large → provenance line `--> GET /api/v1/telemetry · 3.05 ms probe` → a numbered gutter where each measured value carries a **caret row struck under it** (`^^^^^`) holding its qualifier.
- **The 60-sample latency window draws as sixty hairline columns** directly under the caret that annotates it. Direct-labelled. No gridlines, no legend, no axis furniture. Hand-built SVG — a charting library is banned by PRODUCT.md.
- Closes on `= note: every value above is measured on read`.

### Signature motion: the caret sweep

The `^^^^^` underline redraws left-to-right (~180 ms) beneath a freshly-read value, with a single tabular-numeral swap. Gated behind `prefers-reduced-motion: no-preference`. **Live-ness is expressed as the annotation being re-drawn** — never as a pulsing dot, a glow, or a breathing badge.

### Cross-panel reach

| Panel | Treatment |
|---|---|
| **SVC-001 Vitals** | The canonical diagnostic block described above. |
| **REC-002 Records** | A diagnostic listing: gutter row indices, `= note:` for the seed hint, `error[404]`-style blocks for failures, per-field form errors as caret annotations under the offending field. |
| **REQ-003 Probe** | Request and response as paired diagnostic blocks. The deliberate 404 preset renders as a genuine `error[404]` block over the real error envelope. |
| **BND-004 Boundaries** | The four layers as a numbered gutter with `-->` source paths and `= help:` command rows; the four rules as lint-rule entries carrying their identifiers (R1–R4). |

---

## Non-negotiables carried from PRODUCT.md

**Never fabricate:** patient data as real people, uptime or latency figures, coverage numbers, benchmarks, user counts, compliance certification, or deployment/production claims. This system has never run in production. HIPAA and GDPR conformance is **not** established.

**Real numbers or no numbers.** An unmeasurable value renders as an em dash — never as `0`.

**Do not add** a CSS framework, a component library, or a charting library. Charts are hand-built SVG. Icons: `lucide-react` only.

**`architecture.boundariesStatus` and `architecture.apiDriftStatus` are hardcoded string constants** at `src/routes/telemetry.route.ts:78-79`. They are declared policy, never verified results. Present them as policy plus the command that would prove it (`bun run check:boundaries`, `bun run check:api-drift`).

**Every honesty notice in the incumbent survives in substance.** They are itemised in the file map below so none is lost in the rewrite.

---

## File map — what to write, keep, delete

### `dashboard/index.html` (46 lines)
Replace: `<title>`, the Google Fonts link (Saira + Martian Mono → **Chivo + Chivo Mono**), and the direction contract comment. Keep `<meta name="color-scheme">` but flip it to `light`.

The contract goes in as an **HTML comment, first child of `<body>`**, ≤150 words, blocks THESIS / OWN-WORLD / STORY / FIRST VIEWPORT / FORM, `FORM:` line naming the world and carrying `seed efa2b6fa`, closing with this line **verbatim**:

```
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```

### `dashboard/src/index.css` (1,634 lines) — full rewrite
Every CRT token goes. New: the six-colour palette above, two type families, hairline rules, the petrol field, the numbered gutter, the caret row, the sixty-column window. No `border-radius` anywhere. No `box-shadow` anywhere.

### `dashboard/src/App.tsx` (289 lines) — rewrite the shell, keep the machinery
**Preserve exactly:** `interface Telemetry` (system / memory / database / entities / architecture / telemetryLatencyMs), `formatUptime(seconds)`, the `sample()` fetch of `/api/v1/telemetry`, the two sample buffers (`database.latencyMs` → ch1, `memory.heapUsagePercent` → ch2, sliced to the 60-sample window), the poll detents (2.0 s / 3.0 s / 5.0 s / 10 s / HOLD=0), the trigger derivation (`fault || dbLost ? 'LOST' : held ? 'HELD' : 'AUTO'` — rename the vocabulary to diagnostic terms, keep the logic), `onRailKey`'s Arrow/Home/End roving tablist, and the footer links `/docs`, `/docs/openapi.json`, `/health`.
`FNS` becomes the four checks: SIG-01→**SVC-001**, REC-02→**REC-002**, REQ-03→**REQ-003**, BND-04→**BND-004**.

### `dashboard/src/components/ServiceVitals.tsx` (244 lines) — rewrite
Keep all four measurements (Uptime, Heap in use, PG round-trip, Active patients) with their note lines: runtime, `heapUsagePercent`/`heapTotalMB`/`rssMB`, `provider`/`status`/`telemetryLatencyMs`, `activeUsers` staff + `auditLogsCount` audit rows + "soft-deleted rows excluded". Keep `seg()`'s digit-grid blanking behaviour in whatever form the new type system needs. `Meter` (20 segments, zones ≥0.75 hi / ≥0.9 over) is CRT furniture — replace with the caret/gutter equivalent, keep the threshold semantics.
**Two distinct fault plates must survive:** (a) telemetry read failed → names `./run.sh dev` on port 3000; (b) "CH1 open" → the service answers but the Postgres round-trip failed, so round-trip and record counts are not measurable. Re-word into diagnostic language; keep both cases distinct.
**Closing honesty plate survives:** values measured at read time by the running process, no synthetic signal, the window holds the last 60 samples only so it is a live view and not a history, nothing retained across a reload.

### `dashboard/src/components/MasterRecords.tsx` (651 lines) — rewrite, densest file
Keep: `PATIENT_COLS` (MRN, Name, Born, Sex, Blood, Contact\*, Registered\*), `STAFF_COLS` (Account, Name, Role, Status, Phone\*, Created\*), `GENDERS`, `BLOOD_TYPES`, `BLOOD_LABEL` (`O_POSITIVE`→`O+` … `UNKNOWN`→`—`), `EMPTY_FORM`, `title()`, `day()`, `fieldErrors(body)` (reads `errors ?? details ?? issues`, `field ?? path ?? param`), `SortHead` with `aria-sort`, the 300 ms search debounce, `load()` → `/api/v1/${patients|users}?page&limit&sortBy&sortOrder[&search]`, `submit()` → `POST /api/v1/patients` with per-field errors and `setSaved(body?.data?.medicalRecordNumber)`.
**MRN is server-assigned** — never generate one client-side.
Empty states must keep distinguishing *no search match* from *empty ledger* (the latter names `bun run db:seed`).
Legend copy survives: "Register patient · POST /api/v1/patients".
**Closing plate survives:** these are seeded fixtures in a development database, not real people.

### `dashboard/src/components/RequestConsole.tsx` (215 lines) — rewrite
Keep all 7 `PRESETS` verbatim with their notes: `/api/v1`, `/health`, `/api/v1/telemetry`, `/api/v1/patients?limit=3&page=1`, `/api/v1/users?limit=3&page=1`, `/api/v1/patients/does-not-exist` (deliberate 404), `/docs/openapi.json`. Keep `Result {status,statusText,contentType,bytes,ms,body}`, `performance.now()` timing, JSON pretty-print with raw-text fallback, `TextEncoder` byte count, clipboard copy with the refusal fallback message.
**Keep the `bad = status >= 400` plate:** the body is the service's real error envelope carrying `code`, `requestId`, `path` — the same shape every failure returns.
**Keep the round-trip caveat:** measured in this tab with `performance.now()`, so it includes browser and network cost — not a server-side figure.

### `dashboard/src/components/BoundaryEnforcement.tsx` (173 lines) — rewrite
Keep `LAYERS` 01 Route / 02 Controller / 03 Service / 04 Repository with their globs (`src/modules/*/*.route.ts` etc.) and duty prose, and `RULES` R1 Single-writer ownership / R2 Public module API / R3 Unidirectional dependencies / R4 Shared kernel isolation with their text.
**Keep the critical honesty plate:** "**These two values are declarations, not results.** They are string constants in `src/routes/telemetry.route.ts`" + the two `bun run check:*` commands, which run as gates inside `bun run build`.
**Keep the closing plate:** never run in production, no compliance certification, not a statement about HIPAA or GDPR conformance, neither of which is established here.

### Delete — pure CRT costume
`Beam.tsx` (166) · `Knob.tsx` (87) · `Screen.tsx` (78) · `SevenSegment.tsx` (131)
`Beam.tsx` exports `TRACE_WINDOW` and `pickScale` — the 60-sample window constant needs a new home; `pickScale` dies with the graticule.

### `dashboard/public/favicon.svg` — replace
A caret mark in petrol on the light ground. No CRT phosphor.

### `dashboard/DESIGN.md` — do not touch by hand
It is **stale** (documents an older "PACS reading panel" world, seed `21f5e344`, whose component list does not match the built code). Per new-work.md this is not repaired as a side effect. The **documenter rewrites it at finish, from the built world.**

---

## Remaining pipeline, in order

1. Open the chosen card's **QUALITY BAR board + hero** as the craft bar.
2. **Load `reference/craft-floor.md`** — `/Users/keiru/.claude/skills/impeccable/reference/craft-floor.md`. Immediately before editing UI. It was never loaded in the previous session. Do not skip it.
3. Write the direction contract into `dashboard/index.html`.
4. Build the world (file map above).
5. `cd dashboard && bun run build` (`tsc -b && vite build`) — must be clean.
6. **Grep the built output for the seed key `efa2b6fa`** to confirm the contract shipped.
7. `node /Users/keiru/.claude/skills/impeccable/scripts/detect.mjs --json <changed targets>` — **once**, not in a loop.
8. Capture desktop + mobile screenshots to files under `.impeccable/shots/`. Incumbent shots already there for comparison: `desktop-vitals/records/probe/boundaries`, `mobile-vitals/records`.
9. Spawn **`impeccable-finish-reviewer`** fresh — no forked history — with the full input packet. Apply one batch of material fixes, recapture, send back for a verdict. **Two rounds is the ceiling.**
10. Spawn **`impeccable-documenter`** to write `dashboard/DESIGN.md` + sidecar from the built world.

## Environment notes

- Both services were confirmed live: backend `:3000` → 200, vite `:5173` → 200. Re-verify before screenshots.
- `serve-question.mjs` and anything that binds a port need `dangerouslyDisableSandbox: true`.
- No image generation available (`generate-image.mjs` needs `OPENAI_API_KEY`, and there is no harness-native image tool), so `visualize.md` and decision-page sketches are skipped by design.

## Spent directions — must not reappear

Wing & Bay (hospital wayfinding) · Midnight Interchange (transit diagram) · Depot Blind · **Signal Bench** (the CRT scope being replaced) · Slide Rack, Cyclorama, Shoebox Stack (dealt and resolved this round) · the canon card, Grafana-by-way-of-Vercel.

Also in the re-roll pool, unused: Viewfinder, Orizuru, Darkroom (Darkroom additionally re-treads the already-spent PACS safelight world).

---
---

# Resume state — written 2026-08-28 ~17:55, session ended on context exhaustion

## Incident: a second agent overwrote this build mid-flight

Between 17:33 and 17:42 a **different agent harness** (vendored at `.agent/skills/impeccable/`, not Claude Code) built an entirely different dashboard in this working tree — **"Command Deck"**: Inter + JetBrains Mono, `#0B0E14` ground, `#6366F1` indigo accent, five zones, metric tiles, a line chart, plus new `AuditLog.tsx` and `LineChart.tsx`. That is the canon card this brief lists as spent and the user rejected twice. It also edited backend files (deleted `src/routes/dashboard.route.ts`, modified `src/routes/{index,root,docs}.ts`, `prisma/seed.ts`, `tests/db.test.ts`, `docs/CONVENTIONS.md`).

**Resolved with the user:** preserved on branch **`command-deck-agent`**, commit **`32702a0`** — do not delete, it is the only copy. `main` was restored to HEAD (`e26f728`) and the "Checked" build continues there. Backend files are back at HEAD; `dashboard.route.ts` exists again.

**If dashboard files look wrong on resume, check `git status` and mtimes before writing.** `.agent/` is gitignored and still present; the other harness is not currently running.

## Done and verified on disk (`main`)

1. **`dashboard/src/index.css`** — complete full rewrite, the entire "Checked" system. ~950 lines. This is the visual authority; the panels are mappings onto it. Do not rewrite it — extend only where a panel genuinely needs a class it lacks.
2. **`dashboard/public/favicon.svg`** — two hairline rules over two caret marks, petrol `#0A2320` on `#F4F6F2` inside a `#DEE2DD` field. No CRT phosphor.

Fonts verified live on Google Fonts at these exact axes (HTTP 200, both variable):
`family=Chivo:ital,wght@0,300..900;1,300..900&family=Chivo+Mono:ital,wght@0,300..700;1,300..700`

## Still to do, in order

*(Updated 2026-08-28 ~18:4x, second session. Items 1–2 below are now DONE — see "Session 2 progress".)*

1. ~~`dashboard/index.html`~~ — **done.** Contract written, 144 words, `seed efa2b6fa`, verbatim FINISH line, Chivo axes, `color-scheme: light`, title `Checked — Healthcare ERP Backend`.
2. ~~`dashboard/src/App.tsx`~~ — **done.** Shell rewritten; every preserved item in the file map carried over.
3. **Four panels** — `ServiceVitals` **done** (the exemplar). `MasterRecords`, `RequestConsole`, `BoundaryEnforcement` fanned out to parallel subagents.
4. **Delete** `Beam.tsx`, `Knob.tsx`, `Screen.tsx`, `SevenSegment.tsx` — assigned to the typecheck stage. `SAMPLE_WINDOW = 60` now exported from `App.tsx`; `pickScale` dies.
5. Then brief steps 5–10: `cd dashboard && bun run build`, grep built output for `efa2b6fa`, `detect.mjs --json` **once**, screenshots to `.impeccable/shots/`, `impeccable-finish-reviewer` (two rounds max), `impeccable-documenter` for `dashboard/DESIGN.md`.

## Session 2 progress — written 2026-08-28

Both services re-verified live: backend `:3000` → 200, vite `:5173` → 200. Live telemetry now reports
**v1.0.4**, `heapUsagePercent: 104` (heapUsedMB 5.25 > heapTotalMB 5.04) — still real, still unclamped.

**Written and typecheck-clean:**

- **`index.html`** — contract as an HTML comment, first child of `<body>`.
- **`App.tsx`** — `.report` shell. Preserved: `interface Telemetry`, `formatUptime`, `sample()`, both
  buffers sliced to `SAMPLE_WINDOW`, the five rate detents (2/3/5/10 s + HOLD=0), the roving tablist
  (selector updated `button.fn` → `button.check`), the three footer links. `FNS` → `CHECKS`
  (SVC-001/REC-002/REQ-003/BND-004). Trigger derivation kept, revoiced: `aborted` / `held` / `checking`.
  New: `reads` counter → `seq`, and `sevOf` computing each check's severity.
- **`ServiceVitals.tsx`** — the exemplar. Local `Gap` and `Span` components, hand-built `Window`
  (60 `<line>`, `vector-effect="non-scaling-stroke"`, `preserveAspectRatio="none"`), both fault cases
  distinct, both closing honesty notes.

**Two deliberate departures from this brief, both load-bearing:**

1. **The caret sweep is driven by React `key`, not by the `data-strike` value alone.** The brief said
   "remounting is not needed", but a CSS keyframe animation does **not** restart when an attribute's
   *value* changes — only on remount or an animation-name change. So `Span` sets `key={`c${seq}`}` on
   the caret and `key={`v${seq}`}` on the value. `data-strike` stays as the presence hook the CSS
   already targets, so `index.css` needed no change. Without this the signature motion fires once and
   never again.
2. **`.gap` spacers inside `.diag` must be PAIRS** — `<div className="gut gap"/><div className="cell gap"/>`.
   A lone `.gap` child lands in the gutter column *without* the `border-right`, which punches a hole
   in the unbroken `|`. The `Gap` component enforces this.

**`index.css` extended by 14 lines only** (it is otherwise untouched): `.rate-opt:disabled` (a real
missing state) and `.field-grp > .field-label` / `.field-grp > .rate` margins for the field's
label-then-hairline-then-rows rhythm.

**Decided:** no icons anywhere. `lucide-react` stays a dependency but the world has no icon system —
a compiler diagnostic has none, and `index.css` has no icon class. Affordances that were icons
(sort direction, pagination, layer flow) are carried in words or in a mono `^`/`v` caret.

**Still unverified at the time of writing:** `bun run build`, the seed grep, `detect.mjs`,
screenshots, finish review, `DESIGN.md`.

## CSS vocabulary contract — what the panels must use

Read the token block at the top of `index.css` for colour/type/motion tokens. Structural classes:

**Shell:** `.report` (grid: field + sheet) · `.field` (petrol column) · `.field-head` (`checking healthcare-erp-backend v1.0.2 (development)` — b + span) · `.field-label` · `.field-rule` · `.field-note` · `.field-foot` (the three links) · `.checks` + `.check` + `.check-code` / `.check-name` / `.check-sev` (the tablist; `aria-selected` reverses to sheet-on-ink) · `.rate` + `.rate-opt` (poll detents, `aria-pressed`) · `.sheet`

**Diagnostic grid** — `.diag` is `grid-template-columns: var(--gut-w) 1fr`. **Every logical row contributes exactly two children: a `.gut` then a `.cell`.** The gutter rule is `border-right` on contiguous `.gut` cells, so it runs unbroken like `|` — **never introduce row gaps**; use `.gap` / `.gap-lg` spacer rows instead. `.cell-full` spans both columns for the severity line and provenance (they sit outside the gutter, as in rustc).

`.sev` (the one large line; `.sev-key` mono 700 severity-coloured + `.sev-msg` weight 300) · `.prov` + `.prov-arr` (the `-->` line) · `.note` + `.note-key` (`= note:` / `= help:` rows, `data-sev` drives colour) · `.help-cmd` · `.code`

**Spans and carets** — `.span` is a nested grid sharing `--label-w`, which is *what makes the caret land under the value*. Value row: `.span-label` + `.span-val`. Caret row: empty label cell + `.span-ann` containing `.caret` then `.caret-note`. **Caret length must be the value's character count** (`'^'.repeat(display.length)`) — both are Chivo Mono tabular at one size, so widths match exactly. `.dash` for an unmeasurable value (em dash, never `0`).

Worked shape:

```jsx
<div className="gut" aria-hidden="true" />
<div className="cell cell-full">
  <p className="sev" data-sev={sev}>
    <span className="sev-key">{sev}</span>
    <span className="sev-msg">: service answers and Postgres is reachable</span>
  </p>
  <p className="prov"><span className="prov-arr">--&gt;</span> GET /api/v1/telemetry · <b>0.79 ms</b> probe</p>
</div>

<div className="gut">01</div>
<div className="cell">
  <div className="span">
    <span className="span-label">uptime</span>
    <span className="span-val" data-strike={seq}>06:10:16</span>
  </div>
  <div className="span">
    <span aria-hidden="true" />
    <span className="span-ann">
      <span className="caret" data-sev="note" data-strike={seq}>{'^'.repeat(8)}</span>{' '}
      <span className="caret-note">Bun 1.3.11 · alive since the process started</span>
    </span>
  </div>
</div>
```

**Window:** `.win` (the SVG) + `.win-col` (`data-now="true"` on the newest) + `.win-lab` + `.win-empty`. Sixty `<line>` elements, `vector-effect="non-scaling-stroke"` so they stay hairline under `preserveAspectRatio="none"`. No gridlines, no baseline rule, no legend, no axis. Direct-label `now / mean / peak` in `.win-lab` beneath.

**Controls:** `.btn` (+ `.btn-hi`; hover and `aria-pressed` both reverse to ink fill) · `.row` / `.row-end` · `.probes` + `.probe` + `.probe-path` / `.probe-note`

**Records:** `.tbl-wrap` + `.tbl` with `.key` (mono 700 identifiers) / `.mono-cell` / `.dim` / `.num` · `.th-btn` · `.nil` · `.tag` (`data-sev="warn"` for non-ACTIVE) · `data-opt="true"` hides below 900px

**Form:** `.form-grid` · `.f` + `.f-label` + `.in` (`data-bad`) · `.f-err` — a rejected field is annotated like any other span: a `.caret` run struck beneath it carrying the server's message

**Body:** `.pre` (`data-empty`) · **Layout:** `.split` · `.split-31` · `.stack` · `.sr`

## Design decisions already made — keep these

- **Motion.** The caret sweep is `@keyframes strike` (clip-path, 180 ms, exponential ease-out) plus one `swap` on the numeral, both gated behind `prefers-reduced-motion: no-preference`. Drive it by adding a **`reads` counter** to App state (incremented on each successful sample) passed down as `seq` and set as `data-strike` — remounting is not needed, but the attribute must change per read. No pulse, no glow, no breathing badge anywhere.
- **Severity is computed, not chosen.** `note` = normal reading · `warn` = declared-not-verified (BND-004, permanently) and heap ≥ 0.75 · `error` = fault or unmeasurable only. The incumbent Meter thresholds are preserved as the `≥0.75` / `≥0.9` pair, but **`error` is reserved for real faults** — a heap over-scale must not make the page read `error`. Page-level severity = worst *row* severity under that rule.
- **Live telemetry reports `heapUsagePercent: 120`** (Bun reports `heapUsedMB` 10.89 > `heapTotalMB` 9.06). This is real. Handle it honestly in the qualifier — name it as in use against the total the runtime reports — and never clamp it silently to 100.
- **Both sample buffers are used.** ch1 (`database.latencyMs`) draws the sixty-column window under the round-trip row; ch2 (`memory.heapUsagePercent`) draws its own under the heap row. Same grammar.
- **Contrast is checked, not assumed.** Every severity hue has a `-field` variant because ochre/vermilion/cobalt fall below 4.5:1 on petrol. **Keep severity-coloured text on the sheet or use the `--*-field` token on the field** — plain `--error` on `--ground` is only 3.88:1.

