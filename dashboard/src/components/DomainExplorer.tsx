import React, { useState, useEffect } from 'react'
import { UserCheck, Users, Search, Plus, UserPlus, RefreshCw } from 'lucide-react'

interface UserItem {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  phoneNumber?: string | null
  createdAt: string
}

interface PatientItem {
  id: string
  medicalRecordNumber: string
  firstName: string
  lastName: string
  email?: string | null
  gender: string
  bloodType: string
  dateOfBirth: string
  phoneNumber?: string | null
  createdAt: string
}

export const DomainExplorer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'patients'>('patients')
  const [users, setUsers] = useState<UserItem[]>([])
  const [patients, setPatients] = useState<PatientItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '1995-06-15',
    gender: 'FEMALE',
    bloodType: 'O_POSITIVE',
  })
  const [submitting, setSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/users')
      if (res.ok) {
        const json = await res.json()
        setUsers(json.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch users:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true)
      const url = query ? `/api/v1/patients?search=${encodeURIComponent(query)}` : '/api/v1/patients'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setPatients(json.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch patients:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeSubTab === 'users') {
      fetchUsers()
    } else {
      fetchPatients(searchQuery)
    }
  }, [activeSubTab])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeSubTab === 'patients') {
      fetchPatients(searchQuery)
    }
  }

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setActionMessage(null)

    try {
      const res = await fetch('/api/v1/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      })
      const data = await res.json()

      if (res.ok) {
        setActionMessage(`Registered patient: ${data.data.firstName} ${data.data.lastName} (${data.data.medicalRecordNumber})`)
        setShowCreateModal(false)
        setNewPatient({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: '1995-06-15',
          gender: 'FEMALE',
          bloodType: 'O_POSITIVE',
        })
        fetchPatients()
      } else {
        setActionMessage(`Error: ${data.message || 'Failed to register'}`)
      }
    } catch (err) {
      setActionMessage(`Error: ${String(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return <span className="badge badge-rose">{role}</span>
      case 'DOCTOR':
        return <span className="badge badge-emerald">{role}</span>
      case 'NURSE':
        return <span className="badge badge-cyan" style={{ color: '#06b6d4' }}>{role}</span>
      case 'PHARMACIST':
        return <span className="badge badge-violet">{role}</span>
      default:
        return <span className="badge badge-blue">{role}</span>
    }
  }

  return (
    <div>
      {/* Sub tabs and actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeSubTab === 'patients' ? 'btn-primary' : ''}`}
            onClick={() => setActiveSubTab('patients')}
          >
            <Users size={14} />
            <span>Patients Domain ({patients.length})</span>
          </button>
          <button
            className={`btn ${activeSubTab === 'users' ? 'btn-primary' : ''}`}
            onClick={() => setActiveSubTab('users')}
          >
            <UserCheck size={14} />
            <span>Staff Users Domain ({users.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {activeSubTab === 'patients' && (
            <>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Search MRN, Name, Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ width: '220px' }}
                />
                <button type="submit" className="btn">
                  <Search size={14} />
                </button>
              </form>

              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={14} />
                <span>Register Patient</span>
              </button>
            </>
          )}

          <button className="btn" onClick={() => (activeSubTab === 'users' ? fetchUsers() : fetchPatients())}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {actionMessage}
        </div>
      )}

      {/* Table Container */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        {activeSubTab === 'patients' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>MRN Number</th>
                <th>Patient Name</th>
                <th>Gender</th>
                <th>Blood Type</th>
                <th>Contact Email</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading patients data...' : 'No patient records found.'}
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge badge-cyan" style={{ color: '#38bdf8' }}>
                        {p.medicalRecordNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {p.firstName} {p.lastName}
                    </td>
                    <td><span className="badge badge-blue">{p.gender}</span></td>
                    <td><span className="badge badge-violet">{p.bloodType.replace('_', ' ')}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.email || 'N/A'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading staff user accounts...' : 'No user records found.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '600' }}>
                      {u.firstName} {u.lastName}
                    </td>
                    <td style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                      {u.email}
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-emerald' : 'badge-amber'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Patient Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', background: '#0f172a', border: '1px solid var(--border-highlight)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Register New Patient</h3>
              </div>
              <button className="btn" onClick={() => setShowCreateModal(false)} style={{ padding: '4px 8px' }}>✕</button>
            </div>

            <form onSubmit={handleCreatePatient}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>First Name</label>
                  <input
                    required
                    type="text"
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Last Name</label>
                  <input
                    required
                    type="text"
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Blood Type</label>
                  <select
                    value={newPatient.bloodType}
                    onChange={(e) => setNewPatient({ ...newPatient, bloodType: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
