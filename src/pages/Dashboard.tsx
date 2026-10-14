import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api/profileApi";
import { loadStaffRole, logout } from "../lib/auth";
import NotificationBell from "../components/NotificationBell";
import BrandIcon from "../components/BrandIcon";
import "./Dashboard.css";

type FeatureIcon = "search" | "calendar" | "profile";

const FEATURE_CARDS: Array<{
  to: string;
  icon: FeatureIcon;
  title: string;
  description: string;
  action: string;
}> = [
  {
    to: "/skillbrowse",
    icon: "search",
    title: "Browse Skills",
    description: "Find people who can teach the skills you want to learn.",
    action: "Find partners",
  },
  {
    to: "/meetings",
    icon: "calendar",
    title: "Upcoming Sessions",
    description: "View and manage your scheduled SkillSwap sessions.",
    action: "View sessions",
  },
  {
    to: "/profile",
    icon: "profile",
    title: "Your Profile",
    description: "Manage your bio, skills and weekly availability.",
    action: "Manage profile",
  },
];

function FeatureCardIcon({ type }: { type: FeatureIcon }) {
  if (type === "search") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="11"
          cy="11"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="m16 16 4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="4"
          y="5"
          width="16"
          height="15"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 3v4M16 3v4M4 10h16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 20c.7-4 3.3-6 7-6s6.3 2 7 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkAccount() {
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
        return;
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
    <main className="dashboard-page">
      <header className="dashboard-navbar">
        <div className="dashboard-navbar-main">
          <button
            type="button"
            className="dashboard-brand"
            onClick={() => navigate("/dashboard")}
          >
            <BrandIcon className="dashboard-brand-icon" />
            <span>SkillSwap</span>
          </button>

          <nav className="dashboard-nav" aria-label="Main navigation">
            <button
              type="button"
              className="dashboard-nav-link active"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="dashboard-nav-link"
              onClick={() => navigate("/skillbrowse")}
            >
              Browse Skills
            </button>

            <button
              type="button"
              className="dashboard-nav-link"
              onClick={() => navigate("/requests")}
            >
              Requests
            </button>

            <button
              type="button"
              className="dashboard-nav-link"
              onClick={() => navigate("/meetings")}
            >
              Sessions
            </button>

            <button
              type="button"
              className="dashboard-nav-link"
              onClick={() => navigate("/profile")}
            >
              Profile
            </button>
          </nav>

          <div className="dashboard-navbar-actions">
            <NotificationBell />

            <button
              type="button"
              className="dashboard-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-mobile-nav">
          <button
            type="button"
            className="active"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          <button type="button" onClick={() => navigate("/skillbrowse")}>
            Browse
          </button>

          <button type="button" onClick={() => navigate("/requests")}>
            Requests
          </button>

          <button type="button" onClick={() => navigate("/meetings")}>
            Sessions
          </button>

          <button type="button" onClick={() => navigate("/profile")}>
            Profile
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="dashboard-eyebrow">Welcome back</span>

            <h1>
              Learn something new.
              <br />
              Share what you know.
            </h1>

            <p>
              Connect with people who can teach the skills you want to learn,
              and share the skills you already know.
            </p>

            <button
              type="button"
              className="dashboard-primary-button"
              onClick={() => navigate("/skillbrowse")}
            >
              Browse Skills
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="dashboard-hero-visual" aria-hidden="true">
            <div className="exchange-visual">
              <div className="exchange-person exchange-person-left">
                <div className="exchange-avatar">L</div>
                <div>
                  <span>Learn</span>
                  <strong>Discover a skill</strong>
                </div>
              </div>

              <div className="exchange-connection">
                <span>→</span>
                <span>←</span>
              </div>

              <div className="exchange-person exchange-person-right">
                <div className="exchange-avatar">T</div>
                <div>
                  <span>Teach</span>
                  <strong>Share your skill</strong>
                </div>
              </div>
            </div>

            <div className="exchange-caption">
              <span className="exchange-caption-dot" />
              Learn together through skill exchange
            </div>
          </div>
        </section>

        <section className="dashboard-actions-section">
          <div className="dashboard-section-heading">
            <div>
              <span>SkillSwap</span>
              <h2>What would you like to do?</h2>
            </div>
          </div>

          <div className="dashboard-cards-grid">
            {FEATURE_CARDS.map((card) => (
              <button
                type="button"
                key={card.to}
                className="dashboard-feature-card"
                onClick={() => navigate(card.to)}
              >
                <span className="dashboard-card-icon">
                  <FeatureCardIcon type={card.icon} />
                </span>

                <div className="dashboard-card-content">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>

                <span className="dashboard-card-action">
                  {card.action}
                  <span aria-hidden="true">→</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}