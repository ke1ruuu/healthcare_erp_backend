import React from 'react'
import { ShieldCheck, GitBranch, CheckCircle2 } from 'lucide-react'

export const ArchitectureGuard: React.FC = () => {
  const layers = [
    { name: '1. Route Layer', file: '*.route.ts', desc: 'URL routing, RBAC guards & Zod DTO schema validation' },
    { name: '2. Controller Layer', file: '*.controller.ts', desc: 'Request extraction & standardized JSON response envelopes' },
    { name: '3. Application Service', file: '*.service.ts', desc: 'Domain business rules, MRN generation, transactions & audits' },
    { name: '4. Repository Layer', file: '*.repository.ts', desc: 'Prisma client queries with soft-delete (deletedAt: null) filters' },
  ]

  const rules = [
    { title: 'Single-Writer Ownership', desc: 'Every database table is owned exclusively by one domain module.' },
    { title: 'Public Module API Barrels', desc: 'Modules only expose service contracts via index.ts; repositories remain strictly private.' },
    { title: 'Unidirectional Dependencies', desc: 'Downstream transactional modules may depend on Upstream master modules, but never vice versa.' },
    { title: 'Shared Kernel Isolation', desc: 'src/shared/, config, and db never import feature modules.' },
  ]

  return (
    <div>
      {/* Overview Banner */}
      <div className="glass-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ShieldCheck size={22} color="#34d399" />
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Modular-Monolith Architecture & Governance</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '900px' }}>
          The Healthcare ERP Backend enforces autonomous domain boundaries, preventing tight coupling and circular dependencies while maintaining a unified, high-performance Bun runtime.
        </p>
      </div>

      {/* 4-Tier Layer Flow */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <GitBranch size={16} color="#38bdf8" />
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            4-Tier Request Lifecycle & Isolation
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {layers.map((l, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(11, 17, 32, 0.7)',
                border: '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8', marginBottom: '4px' }}>
                {l.file}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {l.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {l.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Boundary Rules Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {rules.map((r, idx) => (
          <div key={idx} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#34d399" />
              <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{r.title}</h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {r.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
