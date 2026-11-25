import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage, getFieldErrors } from '../lib/api'
import { loadStaffRole, login } from '../lib/auth'
import AuthPanelArt from '../components/AuthPanelArt'
import BrandIcon from '../components/BrandIcon'
import './Login.css'

type FieldErrors = {
  username?: string
  password?: string
}

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!username.trim()) {
      next.username = 'Please enter your username.'
    }
    if (!password) {
      next.password = 'Please enter your password.'
    }
    return next
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    const localErrors = validate()
    setFieldErrors(localErrors)
    if (Object.keys(localErrors).length > 0) {
      return
    }

    setLoading(true)

    try {
      await login({ username: username.trim(), password })
      const isStaff = await loadStaffRole().catch(() => false)
      navigate(isStaff ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      const mapped = getFieldErrors(err, ['username', 'password'])
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped)
      } else {
        setFieldErrors({
          password: getErrorMessage(err),
        })
      }
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-page-bg" aria-hidden="true">
        <span className="login-blob login-blob-a" />
        <span className="login-blob login-blob-b" />
        <span className="login-blob login-blob-c" />
        <span className="login-grid" />
      </div>

      <section className="auth-card" aria-label="Sign in">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-brand-row">
            <BrandIcon className="auth-brand-icon" />
            <span>SkillMatch</span>
          </div>

          <header className="auth-form-header">
            <h1>Welcome back</h1>
            <p>Enter your account details to continue.</p>
          </header>

          <nav className="auth-tabs" aria-label="Account">
            <Link to="/login" className="auth-tab is-active" aria-current="page">
              Sign in
            </Link>
            <Link to="/register" className="auth-tab">
              Create account
            </Link>
          </nav>

          <div className={`auth-field${fieldErrors.username ? ' has-error' : ''}`}>
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (fieldErrors.username) {
                  setFieldErrors((prev) => ({ ...prev, username: undefined }))
                }
              }}
              placeholder="your.username"
              required
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? 'login-username-error' : undefined}
            />
            {fieldErrors.username ? (
              <p id="login-username-error" className="auth-field-error" role="alert">
                {fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div className={`auth-field${fieldErrors.password ? ' has-error' : ''}`}>
            <label htmlFor="login-password">Password</label>
            <div className="auth-password-row">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }))
                  }
                }}
                placeholder="••••••••"
                required
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                disabled={loading}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password ? (
              <p id="login-password-error" className="auth-field-error" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <button className={`auth-submit${loading ? ' is-busy' : ''}`} type="submit" disabled={loading}>
            {loading ? (
              <span className="auth-submit-busy">
                <BrandIcon className="auth-submit-icon" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>

          <p className="auth-footer">
            New here? Switch to <Link to="/register">Create account</Link>
          </p>
        </form>

        <aside className="auth-panel" aria-label="About SkillMatch">
          <div className="auth-panel-glow" aria-hidden="true" />
          <div className="auth-panel-content">
            <h2>Swap skills. Grow together.</h2>
          </div>
          <AuthPanelArt />
        </aside>
      </section>
    </main>
  )
}
