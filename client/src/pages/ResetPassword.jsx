import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import Navbar from '../components/Layout/Navbar'
import Footer from '../components/Layout/Footer'

export default function ResetPassword() {
  const { token } = useParams()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authAPI.resetPassword(token, { password: data.password, confirmPassword: data.confirmPassword })
      toast.success('Security key updated successfully.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Token may be expired.')
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
              Protocol: Key Update
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>Set New Security Key</h1>
          </div>
          <div className="card" style={{ padding: 36 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">New Security Key</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Min. 6 characters"
                  {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                {errors.password && <div className="form-error">{errors.password.message}</div>}
              </div>
              <div style={{ marginBottom: 28 }}>
                <label className="form-label">Confirm New Key</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Repeat password"
                  {...register('confirmPassword', {
                    required: 'Please confirm',
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
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Updating...</> : 'Update Security Key'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Back to Login</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
