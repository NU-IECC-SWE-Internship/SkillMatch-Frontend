import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../lib/api'
import { login } from '../lib/auth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login({ username: username.trim(), password })
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-atmosphere" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
        <span className="grid-glow" />
      </div>

      <section className="login-shell">
        <div className="login-brand">
          <p className="brand-mark">SkillMatch</p>
          <h1>Find the right skills. Build the right team.</h1>
          <p className="brand-copy">
            Sign in to connect talent with opportunity in one calm, clear place.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <header className="login-form-header">
            <h2>Welcome back</h2>
            <p>Use your SkillMatch username and password.</p>
          </header>

          {error ? (
            <div className="login-alert" role="alert">
              {error}
            </div>
          ) : null}

          <label className="field">
            <span>Username</span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your.username"
              required
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="ghost-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="login-footer">
            New here?{' '}
            <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </main>
  )
}
