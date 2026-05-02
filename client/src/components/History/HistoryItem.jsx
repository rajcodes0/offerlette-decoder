import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatRelativeDate, getRiskColor, getRiskLabel, truncate } from '../../utils/formatters'

export default function HistoryItem({ analysis, onDelete }) {
  const navigate = useNavigate()
  const score = analysis.result?.overallRiskScore ?? 0
  const color = getRiskColor(score)
  const label = getRiskLabel(score)
  const preview = truncate(analysis.rawText || 'No preview available', 90)

  return (
    <div
      onClick={() => navigate(`/analysis/${analysis._id}`)}
      style={{
        padding: '16px 18px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-light)'
        e.currentTarget.style.background = 'var(--bg-card-hover)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--bg-card)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatRelativeDate(analysis.createdAt)}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: 10,
            background: `${color}18`, color,
          }}>
            {label} · {score}/10
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/analysis/${analysis._id}`) }}
            style={{
              fontSize: 12, color: 'var(--accent-light)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
            }}
          >
            View →
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(analysis._id) }}
            style={{
              fontSize: 13, color: 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--risk-red)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {preview}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {analysis.inputType === 'pdf' ? '📄 PDF' : '📝 Text'} · #{analysis._id?.slice(-6)}
      </div>
    </div>
  )
}
