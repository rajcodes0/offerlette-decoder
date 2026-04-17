import React, { useState } from 'react'
import toast from 'react-hot-toast'
import RiskGauge from './RiskGauge'
import ClauseTable from './ClauseTable'
import { getRiskBadgeClass } from '../../utils/formatters'

export default function AnalysisResult({ data }) {
  const { result } = data
  const [copied, setCopied] = useState(false)

  if (!result) return null

  const {
    clauses = [],
    overallRiskScore = 0,
    salaryAssessment,
    negotiationScript,
    topRedFlags = [],
  } = result

  const handleCopy = () => {
    if (negotiationScript) {
      navigator.clipboard.writeText(negotiationScript)
      setCopied(true)
      toast.success('Script copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const marketColor = {
    above: 'var(--risk-green)',
    market: 'var(--risk-yellow)',
    below: 'var(--risk-red)',
  }[salaryAssessment?.marketComparison] || 'var(--text-secondary)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeInUp 0.5s ease' }}>

      {/* Top section: score + red flags + salary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Score + Red Flags */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <RiskGauge score={overallRiskScore} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                Top Red Flags
              </div>
              {topRedFlags.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topRedFlags.map((flag, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px',
                      background: 'var(--risk-red-bg)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 'var(--radius)',
                    }}>
                      <span style={{ color: 'var(--risk-red)', fontSize: 14, marginTop: 1 }}>⚠</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{flag}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No significant red flags detected.</div>
              )}
            </div>
          </div>
        </div>

        {/* Salary Assessment */}
        {salaryAssessment && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 16 }}>💰</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Salary Assessment</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                Offered Base
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700 }}>
                {salaryAssessment.offeredAmount}
              </div>
              {salaryAssessment.currency && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{salaryAssessment.currency} / Year</div>
              )}
            </div>

            {salaryAssessment.marketComparison && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Assessment</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: 20,
                  background: `${marketColor}18`,
                  color: marketColor,
                }}>
                  {salaryAssessment.marketComparison} market
                </span>
              </div>
            )}

            {salaryAssessment.note && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {salaryAssessment.note}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Negotiation Script */}
      {negotiationScript && (
        <div className="card" style={{
          padding: 24,
          background: 'linear-gradient(135deg, rgba(108,99,255,0.08) 0%, var(--bg-card) 100%)',
          border: '1px solid rgba(108,99,255,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)' }}>The Executive Script</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Strategic Negotiation Response
                </div>
              </div>
            </div>
            <span style={{
              fontSize: 10, color: 'var(--accent-light)', background: 'var(--accent-dim)',
              padding: '2px 10px', borderRadius: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              • Tone: Professional & Data-Driven
            </span>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '18px 20px',
            marginBottom: 16,
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            whiteSpace: 'pre-wrap',
          }}>
            "{negotiationScript}"
          </div>

          <button onClick={handleCopy} className="btn btn-outline" style={{ fontSize: 13 }}>
            {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
          </button>
        </div>
      )}

      {/* Clauses Table */}
      {clauses.length > 0 && <ClauseTable clauses={clauses} />}
    </div>
  )
}
