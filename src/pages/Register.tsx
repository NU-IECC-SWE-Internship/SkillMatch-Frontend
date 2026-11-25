import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage, getFieldErrors } from '../lib/api'
import { register } from '../lib/auth'
import AuthPanelArt from '../components/AuthPanelArt'
import BrandIcon from '../components/BrandIcon'
import './Login.css'

type FieldErrors = {
  username?: string
  email?: string
  password?: string
}

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function clearField(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      return { ...prev, [field]: undefined }
    })
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!username.trim()) {
      next.username = 'Please enter a username.'
    }
    if (!email.trim()) {
      next.email = 'Please enter an email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.'
    }
    if (!password) {
      next.password = 'Please enter a password.'
    } else if (password.length < 6) {
      next.password = 'Password must be at least 6 characters.'
    }
    return next
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const localErrors = validate()
    setFieldErrors(localErrors)
    if (Object.keys(localErrors).length > 0) {
      return
    }

    setLoading(true)

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      })
      navigate('/onboarding', { replace: true })
    } catch (err) {
      const mapped = getFieldErrors(err, ['username', 'email', 'password'])
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped)
      } else {
        setFormError(getErrorMessage(err))
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

      <section className="auth-card" aria-label="Create account">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-brand-row">
            <BrandIcon className="auth-brand-icon" />
            <span>SkillMatch</span>
          </div>

          <header className="auth-form-header">
            <h1>Create account</h1>
            <p>Set up your SkillMatch profile in a minute.</p>
          </header>

          <nav className="auth-tabs" aria-label="Account">
            <Link to="/login" className="auth-tab">
              Sign in
            </Link>
            <Link to="/register" className="auth-tab is-active" aria-current="page">
              Create account
            </Link>
          </nav>

          {formError ? (
            <div className="auth-alert" role="alert">
              {formError}
            </div>
          ) : null}

          <div className={`auth-field${fieldErrors.username ? ' has-error' : ''}`}>
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                clearField('username')
              }}
              placeholder="your.username"
              required
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? 'register-username-error' : undefined}
            />
            {fieldErrors.username ? (
              <p id="register-username-error" className="auth-field-error" role="alert">
                {fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div className={`auth-field${fieldErrors.email ? ' has-error' : ''}`}>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearField('email')
              }}
              placeholder="you@example.com"
              required
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            />
            {fieldErrors.email ? (
              <p id="register-email-error" className="auth-field-error" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className={`auth-field${fieldErrors.password ? ' has-error' : ''}`}>
            <label htmlFor="register-password">Password</label>
            <div className="auth-password-row">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearField('password')
                }}
                minLength={6}
                required
                disabled={loading}
                placeholder="At least 6 characters"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
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
              <p id="register-password-error" className="auth-field-error" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <button className={`auth-submit${loading ? ' is-busy' : ''}`} type="submit" disabled={loading}>
            {loading ? (
              <span className="auth-submit-busy">
                <BrandIcon className="auth-submit-icon" />
                Creating…
              </span>
            ) : (
              'Create account'
            )}
          </button>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
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
