import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, validatePassword, validateEmail } from '../utils/api'
import './Auth.css'

export default function AuthPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showPwInfo, setShowPwInfo] = useState(false)

  const pwResult    = password ? validatePassword(password) : null
  const emailResult = email    ? validateEmail(email)       : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    const ev = validateEmail(email)
    if (!ev.valid) { setMessage({ type: 'error', text: ev.msg }); return }

    const pv = validatePassword(password)
    if (!pv.valid) { setMessage({ type: 'error', text: pv.msg }); return }

    setLoading(true)
    try {
      const data = mode === 'register'
        ? await api.register(email, password)
        : await api.login(email, password)

      if (data.success) {
        login({ email, id: data.user_id ?? null })
        setMessage({ type: 'success', text: `${mode === 'login' ? 'Login' : 'Registration'} successful! Redirecting...` })
        setTimeout(() => navigate('/store'), 900)
      } else {
        setMessage({ type: 'error', text: data.message || 'Authentication failed.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error — check backend status.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page page-enter">
      {/* Decorative background */}
      <div className="auth-bg">
        <div className="auth-bg-orb orb1" />
        <div className="auth-bg-orb orb2" />
      </div>

      {/* Left hero panel — desktop only */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="hero-logo">⬡</div>
          <h1 className="hero-title">NEXUS<br />TECH</h1>
          <p className="hero-tagline">Premium electronics.<br />Delivered to the future.</p>
          <div className="hero-features">
            <div className="hero-feature"><span className="feature-dot" /><span>Cutting-edge tech gadgets</span></div>
            <div className="hero-feature"><span className="feature-dot" /><span>ACID-safe transactions</span></div>
            <div className="hero-feature"><span className="feature-dot" /><span>Real-time stock updates</span></div>
          </div>
        </div>
      </div>

      {/* Right panel — always full-width on mobile */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper">

          {/* Mobile-only logo */}
          <div className="auth-mobile-logo">⬡ NEXUS TECH</div>

          {/* ── TABS — always visible ── */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setMessage(null) }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setMessage(null) }}
            >
              Register
            </button>
          </div>

          <h2 className="auth-heading">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="auth-subheading text-secondary">
            {mode === 'login'
              ? 'Sign in to access your NEXUS account'
              : 'Join NEXUS and start exploring premium tech'}
          </p>

          {/* SQA badges */}
          <div className="sqa-badges-row">
            <span className="sqa-badge sqa-sql">⚙ PreparedStatements</span>
            <span className="sqa-badge sqa-bva">◈ BVA Validation</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Email */}
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className={`input-field ${emailResult ? (emailResult.valid ? 'valid' : 'error') : ''}`}
                placeholder="user@nexustech.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password with BVA indicator */}
            <div className="input-group">
              <label className="input-label">
                Password
                <button
                  type="button"
                  className="bva-info-btn"
                  onClick={() => setShowPwInfo(v => !v)}
                >
                  BVA ?
                </button>
              </label>
              <input
                type="password"
                className={`input-field ${pwResult ? (pwResult.valid ? 'valid' : 'error') : ''}`}
                placeholder="8–20 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />

              {/* BVA Info Panel */}
              {showPwInfo && (
                <div className="bva-panel">
                  <div className="bva-panel-title">
                    <span className="sqa-badge sqa-bva">BVA — Boundary Value Analysis</span>
                  </div>
                  <div className="bva-table">
                    <div className="bva-row bva-header">
                      <span>Value</span><span>Chars</span><span>Result</span>
                    </div>
                    {[
                      { label: 'Below lower', chars: '7',  result: 'INVALID', cls: 'fail' },
                      { label: 'Lower bound', chars: '8',  result: 'VALID',   cls: 'pass' },
                      { label: 'Nominal',     chars: '12', result: 'VALID',   cls: 'pass' },
                      { label: 'Upper bound', chars: '20', result: 'VALID',   cls: 'pass' },
                      { label: 'Above upper', chars: '21', result: 'INVALID', cls: 'fail' },
                    ].map(r => (
                      <div key={r.label} className="bva-row">
                        <span>{r.label}</span>
                        <span className="font-mono">{r.chars}</span>
                        <span className={`bva-result ${r.cls}`}>{r.result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live BVA meter */}
              {password && (
                <div className="pw-meter">
                  <div className="pw-meter-bar">
                    <div
                      className={`pw-meter-fill ${password.length < 8 || password.length > 20 ? 'fill-red' : 'fill-green'}`}
                      style={{ width: `${Math.min((password.length / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`pw-meter-label font-mono ${pwResult?.valid ? 'text-green' : 'text-red'}`}>
                    {pwResult?.msg}
                  </span>
                </div>
              )}
            </div>

            {/* Alert message */}
            {message && (
              <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
                <span>{message.type === 'error' ? '✗' : '✓'}</span>
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-success'} btn-full`}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Switch mode hint — extra clear on mobile */}
          <div className="auth-switch-hint">
            {mode === 'login' ? (
              <p>Don't have an account?{' '}
                <button className="switch-link" onClick={() => { setMode('register'); setMessage(null) }}>
                  Register here
                </button>
              </p>
            ) : (
              <p>Already have an account?{' '}
                <button className="switch-link" onClick={() => { setMode('login'); setMessage(null) }}>
                  Sign in here
                </button>
              </p>
            )}
          </div>

          {/* Security notes */}
          <div className="auth-security-notes">
            <div className="security-note">
              <span className="note-icon">🔒</span>
              <span>SQL injection prevention via PreparedStatements</span>
            </div>
            {mode === 'register' && (
              <div className="security-note security-note-warn">
                <span className="note-icon">⚠</span>
                <span>Known limitation: Passwords stored in plaintext. BCrypt recommended for production.</span>
              </div>
            )}
            <div className="security-note security-note-warn">
              <span className="note-icon">⚠</span>
              <span>Known limitation: No JWT session tokens (stateless auth). Future improvement noted.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
