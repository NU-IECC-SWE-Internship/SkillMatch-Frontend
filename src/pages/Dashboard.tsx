import { useNavigate } from "react-router-dom";
import { clearTokens, logout } from "../lib/auth";
import "./Dashboard.css";


export default function Dashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  // DEV TEST: clear both tokens → login
  function killWholeSession() {
    clearTokens();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-navbar">
        <div className="dashboard-brand" onClick={() => navigate('/dashboard')}>
          <h2>SkillMatch</h2>
        </div>

        <nav className="dashboard-actions">
          <button
            className="nav-secondary-button"
            onClick={() => navigate('/meetings')}
          >
            🎥 Meetings
          </button>

          <button
            className="profile-nav-button"
            onClick={() => navigate('/profile')}
          >
            👤 Profile
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </header>

      <section className="dashboard-content">
        <div className="welcome-banner">
          <p className="dashboard-label">WELCOME TO SKILLMATCH</p>
          <h1>Learn, Teach, and Swap Skills</h1>
          <p className="welcome-description">
            Your collaborative hub for peer-to-peer learning. Connect directly with other members,
            teach what you know, and master new skills through live 1-on-1 video swap sessions.
          </p>
        </div>

        <div className="dashboard-cards-grid">
          {/* Card 1: Video Meetings */}
          <div className="dashboard-feature-card" onClick={() => navigate('/meetings')}>
            <div className="feature-card-icon">🤝</div>
            <div className="feature-card-body">
              <span className="feature-tag">LIVE SESSIONS</span>
              <h3>Video Swap Meetings</h3>
              <p>
                View all your confirmed skill exchange sessions, check partner information,
                and jump straight into live video rooms.
              </p>
            </div>
            <button
              type="button"
              className="feature-action-button primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/meetings');
              }}
            >
              Go to Meetings &rarr;
            </button>
          </div>

          {/* Card 2: Profile & Skills */}
          <div className="dashboard-feature-card" onClick={() => navigate('/profile')}>
            <div className="feature-card-icon">🎯</div>
            <div className="feature-card-body">
              <span className="feature-tag">CUSTOMIZE</span>
              <h3>Profile, Skills & Schedule</h3>
              <p>
                Manage the skills you want to learn or teach, write your bio,
                and configure your weekly availability schedule.
              </p>
            </div>
            <button
              type="button"
              className="feature-action-button secondary"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/profile');
              }}
            >
              Manage Profile &rarr;
            </button>
          </div>
        </div>

        {/* DEV / TESTING ONLY — remove later */}
        <div className="token-test-box">
          <button type="button" onClick={killWholeSession}>
            Kill Whole Session (Clear token testing only)
          </button>
        </div>
      </section>
    </main>
  );
}
