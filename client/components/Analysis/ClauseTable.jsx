import React, { useState } from 'react'
import { getRiskBadgeClass } from '../../utils/formatters'

export default function ClauseTable({ clauses }) {
  const [expanded, setExpanded] = useState({})

  if (!clauses?.length) return null

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
          Full Clause Breakdown
        </h3>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--risk-green)', display: 'inline-block' }} />
            Favorable
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--risk-yellow)', display: 'inline-block' }} />
            Caution
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--risk-red)', display: 'inline-block' }} />
            Critical
          </span>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 140px',
          gap: 16,
          padding: '10px 20px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          <span>Clause Type</span>
          <span>Plain English Reality</span>
          <span>Risk Level</span>
        </div>

        {clauses.map((clause, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 140px',
            gap: 16,
            padding: '16px 20px',
            borderBottom: i < clauses.length - 1 ? '1px solid var(--border)' : 'none',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
            transition: 'background 0.2s',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{clause.title}</div>
              {clause.originalText && (
                <div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    maxHeight: expanded[i] ? 'none' : '40px',
                  }}>
                    {clause.originalText}
                  </div>
                  {clause.originalText.length > 80 && (
                    <button onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                      style={{ fontSize: 11, color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>
                      {expanded[i] ? 'Show less' : 'Expand'}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {clause.plainExplanation}
              {clause.riskReason && (
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {clause.riskReason}
                </div>
              )}
            </div>
            <div>
              <span className={`badge ${getRiskBadgeClass(clause.riskLevel)}`}>
                {clause.riskLevel || 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
