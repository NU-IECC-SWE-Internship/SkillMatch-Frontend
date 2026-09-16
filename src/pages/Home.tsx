import { Link } from 'react-router-dom'
import { isAuthenticated, logout } from '../lib/auth'
import './Home.css'

export default function Home() {
  const signedIn = isAuthenticated()

  return (
    <main className="home-page">
      <div className="home-panel">
        <p className="home-brand">SkillMatch</p>
        <h1>{signedIn ? 'You are signed in' : 'Welcome'}</h1>
        <p>
          {signedIn
            ? 'Welcome to SkillMatch.'
            : 'Sign in with your Django account to get started.'}
        </p>
        <div className="home-actions">
          {signedIn ? (
            <button
              type="button"
              onClick={() => {
                logout()
                window.location.assign('/login')
              }}
            >
              Sign out
            </button>
          ) : (
            <Link to="/login">Go to login</Link>
          )}
        </div>
      </div>
    </main>
  )
}
