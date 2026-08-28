# Build brief — dashboard visual world replacement

**Status:** direction locked, build not started. Resume from step 1 below.
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
