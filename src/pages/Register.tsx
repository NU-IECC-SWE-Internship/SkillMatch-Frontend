import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../lib/api'
import { register } from '../lib/auth'
import { getProfile } from '../api/profileApi'
import './Login.css'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      })

      const profile = await getProfile()

      if (profile.onboarding_completed) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
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
          <h1>Create your account and start matching.</h1>
          <p className="brand-copy">
            Join Now what are you waiting for ?
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <header className="login-form-header">
            <h2>Create account</h2>
            <p>All fields are required.</p>
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
              required
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                disabled={loading}
                placeholder="••••••••"
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
            {loading ? 'Creating…' : 'Create account'}
          </button>

          <p className="login-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  )
}
