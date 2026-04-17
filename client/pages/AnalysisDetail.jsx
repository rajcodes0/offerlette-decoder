import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { analysisAPI } from '../services/api'
import { formatDate } from '../utils/formatters'
import AnalysisResult from '../components/Analysis/AnalysisResult'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'

export default function AnalysisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analysisAPI.getById(id)
        setAnalysis(res.data)
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Analysis not found')
        } else if (err.response?.status === 403) {
          setError('Access denied')
        } else {
          setError('Failed to load analysis')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="page">
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading analysis...</div>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="page">
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
            {error}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            The analysis you're looking for could not be found or you don't have permission to view it.
          </p>
          <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar />
      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '32px 32px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none',
            cursor: 'pointer', marginBottom: 20, transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                Analysis Report #{id?.slice(-6)}
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
                Employment Agreement Analysis
              </h1>
              {analysis?.createdAt && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {analysis.inputType === 'pdf' ? '📄 PDF' : '📝 Text'} · Analyzed on {formatDate(analysis.createdAt)}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--risk-green)',
                background: 'var(--risk-green-bg)',
                padding: '6px 16px', borderRadius: 20,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--risk-green)', display: 'inline-block' }} />
                100% Verified
              </div>
            </div>
          </div>

          {/* Raw text preview */}
          {analysis?.rawText && (
            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: 12, color: 'var(--text-muted)',
              maxHeight: 50, overflow: 'hidden',
            }}>
              {analysis.rawText.slice(0, 200)}…
            </div>
          )}
        </div>

        {analysis && <AnalysisResult data={analysis} />}
      </main>
      <Footer />
    </div>
  )
}
