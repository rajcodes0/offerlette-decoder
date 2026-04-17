import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authAPI.forgotPassword(data.email)
      setSent(true)
      toast.success('Recovery protocol dispatched.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Navbar />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px',
        background: 'radial-gradient(circle at 50% 30%, rgba(108,99,255,0.06) 0%, transparent 70%)',
      }}>
        <div style={{ width: '100%', maxWidth: 440, animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Protocol: Recovery
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>Reset Access Key</h1>
          </div>

          <div className="card" style={{ padding: 36 }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📨</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 10 }}>Recovery Protocol Dispatched</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                  Check your email for a password reset link. The link expires in 1 hour.
                </p>
                <Link to="/login" className="btn btn-primary" style={{ fontSize: 14 }}>
                  Back to Authorization
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                  Enter your registered communication address and we'll dispatch a recovery protocol.
                </p>
                <div style={{ marginBottom: 24 }}>
                  <label className="form-label">Communication Address</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="your@email.com"
                    {...register('email', { required: 'Email is required' })}
                  />
                  {errors.email && <div className="form-error">{errors.email.message}</div>}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Dispatching...</> : 'Dispatch Recovery'}
                </button>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Back to Login</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
