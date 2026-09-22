import { useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-navbar">
        <div className="dashboard-brand" onClick={() => navigate("/dashboard")}>
          <h2>SkillMatch</h2>
        </div>

        <div className="dashboard-user-menu">
          <button className="profile-chip" onClick={() => navigate("/requests")}>
            Incoming Requests
          </button>
           <button className="profile-chip" onClick={() => navigate("/my-requests")}>
            My Requests
          </button>
          <button className="profile-chip" onClick={() => navigate("/profile")}>
            Profile
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="welcome-banner">
          <h1>Welcome back!</h1>
          <p className="welcome-description">
            Ready to exchange skills today? Here is an overview of your activity.
          </p>
        </div>

        <div className="dashboard-cards-grid">
          {/* Action Hub 1: Matches */}
          <div className="dashboard-feature-card" onClick={() => navigate("/matches")}>
            <div className="feature-card-header">
              <span className="feature-card-icon">Match</span>
              <span className="feature-tag">EXPLORE</span>
            </div>
            <div className="feature-card-body">
              <h3>Find Skill Partners</h3>
              <p>Discover community members who match what you want to learn or teach.</p>
            </div>
            <span className="feature-action-link">Browse matches &rarr;</span>
          </div>

          <div className="dashboard-feature-card" onClick={() => navigate("/skillbrowse")}>
            <div className="feature-card-header">
              <span className="feature-card-icon">Skill</span>
              <span className="feature-tag">FILTER</span>
            </div>
            <div className="feature-card-body">
              <h3>Browse by Learning Skill</h3>
              <p>See all people who can teach the skills you want to learn, filtered by your chosen skill.</p>
            </div>
            <span className="feature-action-link">Browse teachers &rarr;</span>
          </div>

          {/* Action Hub 2: Active Meetings */}
          <div className="dashboard-feature-card" onClick={() => navigate("/meetings")}>
            <div className="feature-card-header">
              <span className="feature-card-icon">Live</span>
              <span className="feature-tag">SCHEDULE</span>
            </div>
            <div className="feature-card-body">
              <h3>Upcoming Sessions</h3>
              <p>Check pending requests, upcoming swaps, and join active call rooms.</p>
            </div>
            <span className="feature-action-link">View schedule &rarr;</span>
          </div>
        </div>
      </section>
    </main>
  );
}