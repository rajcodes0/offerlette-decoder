import React from 'react'
import { getRiskColor, getRiskLabel } from '../../utils/formatters'

export default function RiskGauge({ score }) {
  const pct = (score / 10) * 100
  const color = getRiskColor(score)
  const label = getRiskLabel(score)
  const circumference = 2 * Math.PI * 54
  const strokeDash = (pct / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{score}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>/10</span>
        </div>
      </div>
      <div style={{
        fontWeight: 600,
        color,
        background: `${color}18`,
        padding: '3px 12px',
        borderRadius: 20,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontSize: 11,
      }}>
        {label}
      </div>
    </div>
  )
}
