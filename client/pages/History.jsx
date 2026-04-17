import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { analysisAPI } from '../services/api'
import { getRiskColor, getRiskLabel } from '../utils/formatters'
import HistoryItem from '../components/History/HistoryItem'
import DeleteConfirmModal from '../components/UI/DeleteConfirmModal'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'

export default function History() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'low' | 'medium' | 'high'
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analysisAPI.getAll()
        setAnalyses(res.data)
      } catch {
        toast.error('Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDelete = async (id) => {
    try {
      await analysisAPI.delete(id)
      setAnalyses(a => a.filter(x => x._id !== id))
      toast.success('Analysis deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteId(null)
    }
  }

  const filtered = analyses.filter(a => {
    const score = a.result?.overallRiskScore ?? 0
    const matchFilter =
      filter === 'all' ||
      (filter === 'low' && score <= 3) ||
      (filter === 'medium' && score > 3 && score <= 6) ||
      (filter === 'high' && score > 6)
    const matchSearch = !search || (a.rawText || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const stats = {
    total: analyses.length,
    low: analyses.filter(a => (a.result?.overallRiskScore ?? 0) <= 3).length,
    medium: analyses.filter(a => { const s = a.result?.overallRiskScore ?? 0; return s > 3 && s <= 6 }).length,
    high: analyses.filter(a => (a.result?.overallRiskScore ?? 0) > 6).length,
  }

  return (
    <div className="page">
      <Navbar />
      {deleteId && (
        <DeleteConfirmModal onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />
      )}

      <main style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', padding: '36px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Analysis Archive
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Your History
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            All past analyses — click any to view the full report.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Analyses', value: stats.total, color: 'var(--text-primary)' },
            { label: 'Low Risk', value: stats.low, color: 'var(--risk-green)' },
            { label: 'Medium Risk', value: stats.medium, color: 'var(--risk-yellow)' },
            { label: 'High Risk', value: stats.high, color: 'var(--risk-red)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            className="input-field"
            placeholder="Search by content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'low', 'medium', 'high'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                fontSize: 12, fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'capitalize',
                background: filter === f ? 'var(--bg-card)' : 'transparent',
                color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                border: filter === f ? '1px solid var(--border-light)' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {f === 'all' ? 'All' : `${f.charAt(0).toUpperCase() + f.slice(1)} Risk`}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: '60px 32px', textAlign: 'center',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              {analyses.length === 0 ? 'No analyses yet' : 'No results match your filter'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {analyses.length === 0 ? 'Upload your first offer letter from the Dashboard.' : 'Try adjusting your search or filter.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(a => (
              <HistoryItem key={a._id} analysis={a} onDelete={id => setDeleteId(id)} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
