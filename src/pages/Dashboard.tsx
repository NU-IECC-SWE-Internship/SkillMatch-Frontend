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
        <h2>SkillMatch</h2>

        <div className="dashboard-actions">
          <button
            className="profile-nav-button"
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="welcome-card">
          <p className="dashboard-label">DASHBOARD</p>

          <h1>Welcome to SkillMatch</h1>

          <p>
            Find people to learn from, share your skills,
            and start matching.
          </p>

          <button
            className="open-profile-button"
            onClick={() => navigate("/profile")}
          >
            View My Profile
          </button>
        </div>
      </section>
    </main>
  );
}