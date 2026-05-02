import React from 'react'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '24px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', marginBottom: 4 }}>LexAnalytica</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>© 2024 LexAnalytica Systems. Authoritative Clarity.</div>
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        {['Terms of Service', 'Privacy Policy', 'Compliance', 'Legal Notice'].map(link => (
          <a key={link} href="#" style={{ fontSize: '12px', color: 'var(--text-muted)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
            {link}
          </a>
        ))}
      </div>
    </footer>
  )
}
