import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api/profileApi";
import { loadStaffRole, logout } from "../lib/auth";
import { handleCursorGlow } from "../lib/cursorGlow";
import "./Dashboard.css";

const FEATURE_CARDS = [
  {
    to: "/skillbrowse",
    theme: "blue",
    icon: "🔍",
    tag: "DISCOVER",
    title: "Browse skills",
    description: "Find people who can teach the skills you want to learn, or jump to mutual matches.",
    action: "Browse teachers",
  },
  {
    to: "/meetings",
    theme: "teal",
    icon: "🎥",
    tag: "SCHEDULE",
    title: "Upcoming sessions",
    description: "See your upcoming swaps and join live call rooms.",
    action: "View schedule",
  },
  {
    to: "/profile",
    theme: "violet",
    icon: "👤",
    tag: "PROFILE",
    title: "Your profile",
    description: "Update your bio, skills and weekly availability so the right people find you.",
    action: "Edit profile",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkAccount() {
      // Admins only use the admin dashboard and skip onboarding.
      const isStaff = await loadStaffRole().catch(() => false);
      if (cancelled) return;
      if (isStaff) {
        navigate("/admin", { replace: true });
        return;
      }

      try {
        const profile = await getProfile();
        if (!cancelled && !profile.onboarding_completed) {
          navigate("/onboarding", { replace: true });
        }
      } catch {
        // Keep dashboard visible if profile check fails
      }
    }

    void checkAccount();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-page fx-backdrop">
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

      <section className="dashboard-content" onPointerMove={handleCursorGlow}>
        <div className="welcome-banner fx-hero fx-glow fx-rise">
          <h1>Welcome back!</h1>
          <p className="welcome-description">
            Ready to exchange skills today? Pick up where you left off.
          </p>
        </div>

        <div className="dashboard-cards-grid">
          {FEATURE_CARDS.map((card, index) => (
            <button
              type="button"
              key={card.to}
              className={`dashboard-feature-card fx-glow fx-lift fx-accent-top fx-rise fx-d${index + 1} fx-theme-${card.theme}`}
              onClick={() => navigate(card.to)}
            >
              <div className="feature-card-header">
                <span className="fx-icon" aria-hidden="true">{card.icon}</span>
                <span className="feature-tag">{card.tag}</span>
              </div>
              <div className="feature-card-body">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <span className="feature-action-link">
                {card.action} <span className="feature-arrow">&rarr;</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
