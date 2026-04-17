import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authAPI.register({ name: data.name, email: data.email, password: data.password })
      toast.success('Access initialized. Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
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
              Protocol: Registration
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700 }}>
              Access Initialization
            </h1>
          </div>

          <div className="card" style={{ padding: 36 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Full Identity</label>
                <input
                  className="input-field"
                  placeholder="Alexander Vance"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <div className="form-error">{errors.name.message}</div>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Communication</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="vance@lexanalytica.io"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <div className="form-error">{errors.email.message}</div>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Security Key</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Min. 6 characters"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                {errors.password && <div className="form-error">{errors.password.message}</div>}
              </div>

              <div style={{ marginBottom: 28 }}>
                <label className="form-label">Confirm Key</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Repeat password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: val => val === watch('password') || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword.message}</div>}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Initializing...</> : 'Initialize Access'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                Active user?{' '}
                <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
                  Authorize
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
