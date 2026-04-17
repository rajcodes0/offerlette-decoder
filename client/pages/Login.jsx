import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authAPI.login(data)
      login(res.data.token, res.data.user)
      toast.success('Access authorized.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
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
        <div style={{ width: '100%', maxWidth: 460, animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Protocol: Authorization
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700 }}>
              Authorize Access
            </h1>
          </div>

          <div className="card" style={{ padding: 36 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Communication</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="your@email.com"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <div className="form-error">{errors.email.message}</div>}
              </div>

              <div style={{ marginBottom: 28 }}>
                <label className="form-label">Security Key</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="••••••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                {errors.password && <div className="form-error">{errors.password.message}</div>}
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent-light)' }}>
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Authorizing...</> : 'Authorize'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                New user?{' '}
                <Link to="/register" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
                  Initialize Access
                </Link>
              </div>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🔒 L-S Quantum Encrypted 256-bit
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
