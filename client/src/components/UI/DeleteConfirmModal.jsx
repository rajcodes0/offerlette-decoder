import React from 'react'

export default function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div className="card" style={{
        padding: 32, maxWidth: 400, width: '90%',
        animation: 'fadeInUp 0.25s ease',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗑</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Delete Analysis?
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          This action cannot be undone. The analysis will be permanently removed from your history.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} className="btn btn-outline" style={{ flex: 1 }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn" style={{
            flex: 1, background: 'var(--risk-red)', color: '#fff',
          }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
