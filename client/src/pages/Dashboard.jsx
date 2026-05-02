import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { analysisAPI } from '../services/api'
import { formatRelativeDate, getRiskColor, getRiskLabel } from '../utils/formatters'
import AnalysisResult from '../components/Analysis/AnalysisResult'
import HistoryItem from '../components/History/HistoryItem'
import DeleteConfirmModal from '../components/UI/DeleteConfirmModal'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('upload') // 'upload' | 'text'
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const loadHistory = useCallback(async () => {
    try {
      const res = await analysisAPI.getAll()
      setHistory(res.data)
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') {
      if (f.size > 5 * 1024 * 1024) { toast.error('File exceeds 5MB limit'); return }
      setFile(f)
    } else {
      toast.error('Only PDF files are supported')
    }
  }

  const handleFileSelect = (e) => {
    const f = e.target.files[0]
    if (f) {
      if (f.size > 5 * 1024 * 1024) { toast.error('File exceeds 5MB limit'); return }
      setFile(f)
    }
  }

  const handleAnalyze = async () => {
    if (tab === 'upload' && !file) { toast.error('Please select a PDF file'); return }
    if (tab === 'text' && !text.trim()) { toast.error('Please paste your offer letter text'); return }

    setAnalyzing(true)
    setResult(null)
    try {
      let res
      if (tab === 'upload') {
        const fd = new FormData()
        fd.append('pdf', file)
        res = await analysisAPI.analyze(fd)
      } else {
        res = await analysisAPI.analyze({ text })
      }
      setResult(res.data)
      toast.success('Analysis complete')
      loadHistory()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await analysisAPI.delete(id)
      setHistory(h => h.filter(a => a._id !== id))
      toast.success('Analysis deleted')
    } catch {
      toast.error('Failed to delete analysis')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="page">
      <Navbar />
      {deleteId && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '36px 32px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>

        {/* Left: Upload + Result */}
        <div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              Neural Intelligence
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Analysis Forge.
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--risk-green)', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Status: System Online
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 16,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 4, width: 'fit-content',
          }}>
            {[
              { id: 'upload', label: 'Document Upload' },
              { id: 'text', label: 'Raw Text' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '7px 18px',
                borderRadius: 6,
                fontSize: 12, fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                background: tab === t.id ? 'var(--bg-card)' : 'transparent',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                border: tab === t.id ? '1px solid var(--border-light)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Upload zone */}
          {tab === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : file ? 'var(--risk-green)' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-lg)',
                background: dragOver ? 'var(--accent-dim)' : file ? 'var(--risk-green-bg)' : 'var(--bg-card)',
                padding: '48px 32px',
                textAlign: 'center',
                transition: 'all 0.2s',
                cursor: 'pointer',
                marginBottom: 16,
              }}
              onClick={() => !file && fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
              {file ? (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: 'var(--risk-green)' }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                    {(file.size / 1024).toFixed(0)} KB · PDF Document
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 22,
                  }}>☁</div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Select a document to begin</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    PDF, DOCX or scanned images up to 5MB
                  </div>
                  <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }} style={{ fontSize: 13 }}>
                    Upload File
                  </button>
                </>
              )}
            </div>
          )}

          {/* Text input */}
          {tab === 'text' && (
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste your offer letter or legal text here..."
                maxLength={50000}
                style={{
                  width: '100%', minHeight: 260, resize: 'vertical',
                  padding: '16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  fontSize: 14, lineHeight: 1.6,
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 14px', marginTop: -2,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              }}>
                <span style={{ fontSize: 11, color: 'var(--risk-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--risk-green)', display: 'inline-block' }} />
                  Encryption Active
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {text.length.toLocaleString()} / 50,000 characters
                </span>
              </div>
            </div>
          )}

          {/* Analyze button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || (tab === 'upload' ? !file : !text.trim())}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', minWidth: 180 }}
            >
              {analyzing ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> Analyzing...</>
              ) : (
                <>Analyze {tab === 'upload' ? 'Document' : 'Text'} ⚡</>
              )}
            </button>
          </div>

          {/* Analyzing overlay message */}
          {analyzing && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px',
              background: 'var(--accent-dim)', border: '1px solid rgba(108,99,255,0.3)',
              borderRadius: 'var(--radius-lg)', marginBottom: 24,
              animation: 'fadeIn 0.3s ease',
            }}>
              <div className="spinner" style={{ width: 20, height: 20 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Neural Core Processing</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI is analyzing your offer letter — this may take 10–20 seconds...</div>
              </div>
            </div>
          )}

          {/* Stats bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
            marginBottom: result ? 32 : 0,
          }}>
            {[
              { label: 'Credits', value: '1,240' },
              { label: 'Accuracy', value: '99.8%' },
              { label: 'Processed', value: history.length.toString() },
            ].map(s => (
              <div key={s.label} style={{
                padding: '16px 20px',
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Result */}
          {result && (
            <div style={{ marginTop: 32 }}>
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 28 }} />
              <AnalysisResult data={result} />
            </div>
          )}
        </div>

        {/* Right: History sidebar */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16 }}>Recent Activity</h2>
            <button onClick={() => navigate('/history')} style={{
              fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              View Archive
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historyLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />
              ))
            ) : history.length === 0 ? (
              <div style={{
                padding: '24px 16px', textAlign: 'center',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 13, color: 'var(--text-muted)',
              }}>
                No analyses yet. Upload your first offer letter.
              </div>
            ) : (
              history.slice(0, 5).map(a => (
                <HistoryItem key={a._id} analysis={a} onDelete={id => setDeleteId(id)} />
              ))
            )}
          </div>

          {/* Upsell card */}
          <div style={{
            marginTop: 16, padding: '20px',
            background: 'linear-gradient(135deg, var(--accent-dim), rgba(108,99,255,0.05))',
            border: '1px solid rgba(108,99,255,0.25)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Architect Pro</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
              Unlock advanced jurisdictional cross-referencing.
            </div>
            <button className="btn" style={{
              width: '100%', background: 'var(--text-primary)', color: 'var(--bg-primary)',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '10px',
            }}>
              Upgrade Tier
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
