import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: '60px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(10,12,20,0.95)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to={user ? '/dashboard' : '/'} style={{
        fontFamily: 'var(--font-display)',
        fontSize: '17px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
      }}>
        LexAnalytica
      </Link>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/history', label: 'History' },
          ].map(({ path, label }) => (
            <Link key={path} to={path} style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: isActive(path) ? 600 : 400,
              color: isActive(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive(path) ? 'var(--bg-card)' : 'transparent',
              borderBottom: isActive(path) ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
              {label}
            </Link>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {user ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              {user.name?.split(' ')[0]}
            </div>
            <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: '13px' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost" style={{ fontSize: '13px' }}>Sign In</Link>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  )
}
