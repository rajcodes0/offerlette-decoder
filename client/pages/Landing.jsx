import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="page">
      <Navbar />

      {/* Hero */}
      <section style={{
        padding: '80px 32px 100px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 48, maxWidth: 1100, margin: '0 auto', width: '100%',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 400px', animation: 'fadeInUp 0.6s ease' }}>
          <div style={{
            display: 'inline-block', marginBottom: 20,
            fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--accent-light)', background: 'var(--accent-dim)',
            padding: '5px 14px', borderRadius: 20,
          }}>
            Intelligence Protocol V4.0
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 20,
            letterSpacing: '-0.03em',
          }}>
            Decode your future with{' '}
            <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>absolute clarity.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
            AI-powered analysis for complex employment agreements. We architect clarity out of legal ambiguity, ensuring your career transitions are founded on precision.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
              Get Started
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding: '12px 28px', fontSize: 15 }}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Mock terminal card */}
        <div style={{
          flex: '1 1 340px', maxWidth: 420,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.7s ease 0.1s both',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-secondary)',
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Analysis Mode: Active
            </span>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Non-compete clause found', level: 'HIGH RISK', color: 'var(--risk-red)' },
              { label: 'Equity vesting schedule', level: 'REVIEW', color: 'var(--risk-yellow)' },
              { label: 'IP assignment terms', level: 'FLAGGED', color: 'var(--risk-yellow)' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                animation: `fadeInUp 0.5s ease ${0.2 + i * 0.1}s both`,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  background: `${item.color}20`, color: item.color, letterSpacing: '0.05em',
                }}>
                  {item.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '60px 32px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Structural Fidelity
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700 }}>
              Architectural Grade Legal Intelligence
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: '⚡', num: '01', title: 'Instant Risk Scoring', desc: 'Immediate identification of unfavorable terms with weighted risk assessment across 40+ legal categories.' },
              { icon: '🈯', num: '02', title: 'Plain English Clauses', desc: 'Neural-mapped translation of complex legalese into actionable, direct-human insights and summaries.' },
              { icon: '📊', num: '03', title: 'Salary Benchmarking', desc: 'Real-time data parity check against 50,000+ localized professional compensation data points.' },
              { icon: '💬', num: '04', title: 'Negotiation Scripts', desc: 'Strategic talk tracks and professional responses mapped to specific risks identified in your contract.' },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Protocol {f.num}
                </div>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>
          Ready to define your own terms?
        </h2>
        <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary" style={{ padding: '14px 36px', fontSize: 16 }}>
          Get Started with LexAnalytica
        </Link>
        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Security Protocol: AES-256 Validated
        </div>
      </section>

      <Footer />
    </div>
  )
}
