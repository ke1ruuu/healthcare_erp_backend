import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FC, FormEvent } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Info, Search } from 'lucide-react'
import { Screen } from './Screen'

type Ledger = 'patients' | 'staff'
type Order = 'asc' | 'desc'

interface Patient {
  id: string
  medicalRecordNumber: string
  firstName: string
  lastName: string
  email: string | null
  phoneNumber: string | null
  dateOfBirth: string
  gender: string
  bloodType: string
  createdAt: string
}

interface Staff {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  phoneNumber: string | null
  createdAt: string
}

interface Meta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface Column {
  key: string
  label: string
  sortable: boolean
  num?: boolean
  /** Dropped on narrow viewports, where the listing would otherwise crush. */
  optional?: boolean
}

const PATIENT_COLS: Column[] = [
  { key: 'medicalRecordNumber', label: 'MRN', sortable: true },
  { key: 'lastName', label: 'Name', sortable: true },
  { key: 'dateOfBirth', label: 'Born', sortable: true },
  { key: 'gender', label: 'Sex', sortable: false },
  { key: 'bloodType', label: 'Blood', sortable: false },
  { key: 'contact', label: 'Contact', sortable: false, optional: true },
  { key: 'createdAt', label: 'Registered', sortable: true, optional: true },
]

const STAFF_COLS: Column[] = [
  { key: 'email', label: 'Account', sortable: true },
  { key: 'lastName', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'phoneNumber', label: 'Phone', sortable: false, optional: true },
  { key: 'createdAt', label: 'Created', sortable: true, optional: true },
]

const GENDERS = ['FEMALE', 'MALE', 'OTHER', 'UNKNOWN'] as const

const BLOOD_TYPES = [
  'O_POSITIVE',
  'O_NEGATIVE',
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'UNKNOWN',
] as const

const BLOOD_LABEL: Record<string, string> = {
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O−',
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A−',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B−',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB−',
  UNKNOWN: '—',
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'UNKNOWN',
  bloodType: 'UNKNOWN',
  email: '',
  phoneNumber: '',
}

function title(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ')
}

function day(iso: string): string {
  return iso.slice(0, 10)
}

/** Pull per-field messages out of whatever shape the validator returned. */
function fieldErrors(body: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!body || typeof body !== 'object') return out
  const bag = body as Record<string, unknown>
  const list = (bag.errors ?? bag.details ?? bag.issues) as unknown
  if (Array.isArray(list)) {
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue
      const issue = raw as Record<string, unknown>
      const path = issue.field ?? issue.path ?? issue.param
      const name = Array.isArray(path) ? String(path[path.length - 1]) : path ? String(path) : ''
      const message = issue.message ? String(issue.message) : ''
      if (name && message) out[name] = message
    }
  }
  return out
}

const SortHead: FC<{
  col: Column
  sortBy: string
  order: Order
  onSort: (key: string) => void
}> = ({ col, sortBy, order, onSort }) => {
  const on = col.sortable && sortBy === col.key
  return (
    <th
      scope="col"
      className={col.num ? 'num' : undefined}
      aria-sort={on ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
      data-opt={col.optional || undefined}
    >
      {col.sortable ? (
        <button type="button" className="th-btn" onClick={() => onSort(col.key)}>
          {col.label}
          {on ? (
            order === 'asc' ? (
              <ArrowUp size={11} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <ArrowDown size={11} strokeWidth={2.4} aria-hidden="true" />
            )
          ) : null}
        </button>
      ) : (
        <span className="th-static">{col.label}</span>
      )}
    </th>
  )
}

export const MasterRecords: FC = () => {
  const [ledger, setLedger] = useState<Ledger>('patients')
  const [rows, setRows] = useState<(Patient | Staff)[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState<Order>('desc')
  const [typed, setTyped] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [fault, setFault] = useState<string | null>(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [formFault, setFormFault] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  const cols = ledger === 'patients' ? PATIENT_COLS : STAFF_COLS

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(typed.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [typed])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder: order,
    })
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/v1/${ledger === 'patients' ? 'patients' : 'users'}?${params}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`)
      setRows(Array.isArray(body.data) ? body.data : [])
      setMeta(body.meta ?? null)
      setFault(null)
    } catch (err) {
      setRows([])
      setMeta(null)
      setFault(err instanceof Error ? err.message : 'read failed')
    } finally {
      setLoading(false)
    }
  }, [ledger, page, limit, sortBy, order, search])

  useEffect(() => {
    void load()
  }, [load])

  const swap = (next: Ledger) => {
    if (next === ledger) return
    setLedger(next)
    setRows([])
    setMeta(null)
    setPage(1)
    setSortBy('createdAt')
    setOrder('desc')
    setTyped('')
    setSearch('')
  }

  const onSort = (key: string) => {
    if (sortBy === key) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(key)
      setOrder('asc')
    }
    setPage(1)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setErrs({})
    setFormFault(null)
    setSaved(null)

    const payload: Record<string, string> = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      bloodType: form.bloodType,
    }
    if (form.email.trim()) payload.email = form.email.trim()
    if (form.phoneNumber.trim()) payload.phoneNumber = form.phoneNumber.trim()

    try {
      const res = await fetch('/api/v1/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        const perField = fieldErrors(body)
        setErrs(perField)
        if (!Object.keys(perField).length) {
          setFormFault(body?.message ?? `Registration rejected — HTTP ${res.status}`)
        }
        return
      }
      setSaved(body?.data?.medicalRecordNumber ?? 'registered')
      setForm(EMPTY_FORM)
      firstFieldRef.current?.focus()
      setPage(1)
      setSortBy('createdAt')
      setOrder('desc')
      void load()
    } catch (err) {
      setFormFault(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const shown = useMemo(() => {
    if (!meta || !meta.total) return null
    const from = (meta.page - 1) * meta.limit + 1
    const to = Math.min(meta.total, from + rows.length - 1)
    return { from, to }
  }, [meta, rows.length])

  return (
    <>
      <div className="head">
        <div className="head-t">
          <h2>Records</h2>
          <span className="head-src">
            GET /api/v1/{ledger === 'patients' ? 'patients' : 'users'} · paged, sorted and searched on the
            server
          </span>
        </div>
        <span className="nom nom-xs">
          {meta ? `${meta.total} rows · page ${meta.page} of ${Math.max(1, meta.totalPages)}` : 'reading'}
        </span>
      </div>

      <div className="bar">
        <div className="gang" role="group" aria-label="Ledger">
          <button
            type="button"
            className="btn"
            aria-pressed={ledger === 'patients'}
            onClick={() => swap('patients')}
          >
            Patients
          </button>
          <button type="button" className="btn" aria-pressed={ledger === 'staff'} onClick={() => swap('staff')}>
            Staff
          </button>
        </div>

        <div className="field" style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <label className="sr" htmlFor="rec-search">
            Search {ledger}
          </label>
          <div className="field-row">
            <Search size={13} strokeWidth={2} style={{ color: 'var(--ink-3)', flex: 'none' }} aria-hidden="true" />
            <input
              id="rec-search"
              type="search"
              value={typed}
              placeholder={ledger === 'patients' ? 'name or MRN' : 'name or email'}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
        </div>

        <div className="bar-end">
          <span className="lamp" data-on={!loading && !fault} data-live={loading || undefined} />
          <span className="nom nom-xs">{loading ? 'reading' : fault ? 'read failed' : 'listing current'}</span>
        </div>
      </div>

      {fault && (
        <div className="plate" data-tone="fault" role="alert">
          <AlertTriangle size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
          <span>
            <b>Listing unavailable</b> — {fault}. The backend must be running on port 3000 with a reachable
            database.
          </span>
        </div>
      )}

      <Screen>
        <div className="listing-wrap">
          <table className="listing">
            <caption className="sr">
              {ledger === 'patients' ? 'Patient' : 'Staff account'} records, page {meta?.page ?? 1}
            </caption>
            <thead>
              <tr>
                {cols.map((col) => (
                  <SortHead key={col.key} col={col} sortBy={sortBy} order={order} onSort={onSort} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && !fault && (
                <tr>
                  <td colSpan={cols.length} style={{ padding: '30px 14px' }}>
                    {search ? (
                      <span className="prose-dim">
                        No {ledger === 'patients' ? 'patient' : 'staff'} record matches{' '}
                        <code>{search}</code>. Clear the search to list all rows.
                      </span>
                    ) : (
                      <span className="prose-dim">
                        This ledger is empty. Populate it with <code>bun run db:seed</code>, or register a
                        patient below.
                      </span>
                    )}
                  </td>
                </tr>
              )}

              {ledger === 'patients' &&
                (rows as Patient[]).map((r) => (
                  <tr key={r.id}>
                    <td className="key">{r.medicalRecordNumber}</td>
                    <td>
                      {r.lastName}, {r.firstName}
                    </td>
                    <td>{day(r.dateOfBirth)}</td>
                    <td>
                      <span className="tag">{title(r.gender)}</span>
                    </td>
                    <td>
                      <span className="tag" data-tone={r.bloodType === 'UNKNOWN' ? 'off' : 'live'}>
                        {BLOOD_LABEL[r.bloodType] ?? r.bloodType}
                      </span>
                    </td>
                    <td className="dim" data-opt="true">
                      {r.email ?? r.phoneNumber ?? <span className="nil">not on file</span>}
                    </td>
                    <td className="dim" data-opt="true">
                      {day(r.createdAt)}
                    </td>
                  </tr>
                ))}

              {ledger === 'staff' &&
                (rows as Staff[]).map((r) => (
                  <tr key={r.id}>
                    <td className="key">{r.email}</td>
                    <td>
                      {r.lastName}, {r.firstName}
                    </td>
                    <td>
                      <span className="tag">{title(r.role)}</span>
                    </td>
                    <td>
                      <span className="tag" data-tone={r.status === 'ACTIVE' ? 'live' : 'amber'}>
                        {title(r.status)}
                      </span>
                    </td>
                    <td className="dim" data-opt="true">
                      {r.phoneNumber ?? <span className="nil">not on file</span>}
                    </td>
                    <td className="dim" data-opt="true">
                      {day(r.createdAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Screen>

      <div className="bar">
        <span className="nom nom-xs">
          {shown && meta
            ? `Showing ${shown.from}–${shown.to} of ${meta.total}`
            : meta
              ? 'No rows on this page'
              : '—'}
        </span>
        <div className="bar-end">
          <button
            type="button"
            className="btn btn-xs"
            disabled={!meta?.hasPreviousPage || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={12} strokeWidth={2.4} aria-hidden="true" />
            Prev
          </button>
          <span className="val val-sm">
            {meta ? `${meta.page} / ${Math.max(1, meta.totalPages)}` : '— / —'}
          </span>
          <button
            type="button"
            className="btn btn-xs"
            disabled={!meta?.hasNextPage || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight size={12} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <fieldset className="blk">
          <legend>Register patient · POST /api/v1/patients</legend>

          {saved && (
            <div className="plate" style={{ marginBottom: 14 }} role="status">
              <Check size={15} strokeWidth={2.4} className="plate-ico" aria-hidden="true" />
              <span>
                Registered. The server assigned medical record number <code>{saved}</code> — it is never
                supplied by this form.
              </span>
            </div>
          )}

          {formFault && (
            <div className="plate" data-tone="fault" style={{ marginBottom: 14 }} role="alert">
              <AlertTriangle size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
              <span>{formFault}</span>
            </div>
          )}

          <div className="grid-form">
            <div className="field">
              <label className="nom nom-xs" htmlFor="p-first">
                First name
              </label>
              <input
                id="p-first"
                ref={firstFieldRef}
                type="text"
                value={form.firstName}
                data-bad={Boolean(errs.firstName)}
                aria-invalid={Boolean(errs.firstName)}
                aria-describedby={errs.firstName ? 'e-first' : undefined}
                onChange={(e) => set('firstName', e.target.value)}
              />
              {errs.firstName && (
                <span className="field-err" id="e-first">
                  {errs.firstName}
                </span>
              )}
            </div>

            <div className="field">
              <label className="nom nom-xs" htmlFor="p-last">
                Last name
              </label>
              <input
                id="p-last"
                type="text"
                value={form.lastName}
                data-bad={Boolean(errs.lastName)}
                aria-invalid={Boolean(errs.lastName)}
                aria-describedby={errs.lastName ? 'e-last' : undefined}
                onChange={(e) => set('lastName', e.target.value)}
              />
              {errs.lastName && (
                <span className="field-err" id="e-last">
                  {errs.lastName}
                </span>
              )}
            </div>

            <div className="field">
              <label className="nom nom-xs" htmlFor="p-dob">
                Date of birth
              </label>
              <input
                id="p-dob"
                type="date"
                value={form.dateOfBirth}
                data-bad={Boolean(errs.dateOfBirth)}
                aria-invalid={Boolean(errs.dateOfBirth)}
                aria-describedby={errs.dateOfBirth ? 'e-dob' : undefined}
                onChange={(e) => set('dateOfBirth', e.target.value)}
              />
              {errs.dateOfBirth && (
                <span className="field-err" id="e-dob">
                  {errs.dateOfBirth}
                </span>
              )}
            </div>

            <div className="field">
              <label className="nom nom-xs" htmlFor="p-sex">
                Sex
              </label>
              <select id="p-sex" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {title(g)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="nom nom-xs" htmlFor="p-blood">
                Blood type
              </label>
              <select id="p-blood" value={form.bloodType} onChange={(e) => set('bloodType', e.target.value)}>
                {BLOOD_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b === 'UNKNOWN' ? 'Unknown' : BLOOD_LABEL[b]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="nom nom-xs" htmlFor="p-email">
                Email · optional
              </label>
              <input
                id="p-email"
                type="email"
                value={form.email}
                data-bad={Boolean(errs.email)}
                aria-invalid={Boolean(errs.email)}
                aria-describedby={errs.email ? 'e-email' : undefined}
                onChange={(e) => set('email', e.target.value)}
              />
              {errs.email && (
                <span className="field-err" id="e-email">
                  {errs.email}
                </span>
              )}
            </div>

            <div className="field">
              <label className="nom nom-xs" htmlFor="p-phone">
                Phone · optional
              </label>
              <input
                id="p-phone"
                type="tel"
                value={form.phoneNumber}
                data-bad={Boolean(errs.phoneNumber)}
                aria-invalid={Boolean(errs.phoneNumber)}
                aria-describedby={errs.phoneNumber ? 'e-phone' : undefined}
                onChange={(e) => set('phoneNumber', e.target.value)}
              />
              {errs.phoneNumber && (
                <span className="field-err" id="e-phone">
                  {errs.phoneNumber}
                </span>
              )}
            </div>
          </div>

          <div className="bar" style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-pri" disabled={saving}>
              {saving ? 'Writing' : 'Write record'}
            </button>
            <span className="nom nom-xs">Validation and the record number both come from the server</span>
          </div>
        </fieldset>
      </form>

      <div className="plate">
        <Info size={15} strokeWidth={2} className="plate-ico" aria-hidden="true" />
        <span>
          Rows are whatever your database holds — seeded fixtures in a development database, not real
          people. Soft-deleted records are excluded by the repository, so counts here match the active rows
          reported on CH1.
        </span>
      </div>
    </>
  )
}
