import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  getUserProfile,
  type PublicUserProfile,
} from "../api/profileApi";

import VerifiedBadge from "../components/VerifiedBadge";
import NotificationBell from "../components/NotificationBell";
import { logout } from "../lib/auth";

import "./ProfileRedesign.css";
function BrandIcon() {
  return (
    <span className="upp-brand-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path
          d="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3 3m-3-3 3-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function UserProfile() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const from = (location.state as { from?: string } | null)?.from;
  const fromPath = from?.split(/[?#]/, 1)[0];

  const backTo =
    from?.startsWith("/") && !from.startsWith("//")
      ? from
      : "/skillbrowse";

  const backLabel =
    fromPath === "/requests"
      ? "Requests"
      : fromPath === "/my-requests"
        ? "My Requests"
        : fromPath === "/dashboard"
          ? "Dashboard"
          : "Browse Skills";

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  let cancelled = false;

  const id = Number(userId);

  setProfile(null);
  setError("");
  setLoading(true);

  if (!userId || Number.isNaN(id)) {
    setError("Invalid user ID.");
    setLoading(false);

    return () => {
      cancelled = true;
    };
  }

  getUserProfile(id)
    .then((data) => {
      if (cancelled) return;

      if (Number(data.user) !== id) {
        setError("Could not load the correct user profile.");
        setProfile(null);
        return;
      }

      setProfile(data);
    })
    .catch((err) => {
      if (!cancelled) {
        console.error(err);
        setError("Could not load user profile.");
        setProfile(null);
      }
    })
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, [userId]);
  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }
  if (loading || error || !profile) {
    return (
      <main className="upp-page">
        <header className="upp-topbar">
          <div className="upp-topbar-main">
            <button
              type="button"
              className="upp-brand"
              onClick={() => navigate("/dashboard")}
            >
              <BrandIcon />
              <span>SkillSwap</span>
            </button>
          </div>
        </header>

        <div className="upp-container">
          <Link to={backTo} className="upp-back-link">
            ← Back to {backLabel}
          </Link>

          {loading ? (
            <div className="upp-loading-card" />
          ) : (
            <div className="upp-state-card">
              {error || "Profile not found."}
            </div>
          )}
        </div>
      </main>
    );
  }

  const initial = profile.username
    ? profile.username.charAt(0).toUpperCase()
    : "?";

  const verifiedCount = profile.teach_skills.filter(
    (skill) => skill.is_verified
  ).length;

  return (
    <main className="upp-page">
      <header className="upp-topbar">
        <div className="upp-topbar-main">
          <button
            type="button"
            className="upp-brand"
            onClick={() => navigate("/dashboard")}
          >
            <BrandIcon />
            <span>SkillSwap</span>
          </button>

          <nav className="upp-main-nav" aria-label="Main navigation">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button type="button" onClick={() => navigate("/skillbrowse")}>
              Browse Skills
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
          </nav>

          <div className="upp-topbar-actions">
            <NotificationBell />
            <button
              type="button"
              className="upp-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="upp-mobile-nav">
          <button type="button" onClick={() => navigate("/dashboard")}>
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

      <div className="upp-container">
        <Link to={backTo} className="upp-back-link">
          ← Back to {backLabel}
        </Link>

        <section className="upp-profile-summary">
          <div className="upp-user-main">
            <div className="upp-avatar">{initial}</div>

            <div className="upp-user-copy">
              <div className="upp-name-row">
                <h1>{profile.username}</h1>

                {profile.rating_count > 0 ? (
                  <span className="upp-rating">
                    <span className="upp-star">★</span>
                    <strong>{profile.rating_average.toFixed(1)}</strong>
                    <span>
                      ({profile.rating_count}{" "}
                      {profile.rating_count === 1 ? "review" : "reviews"})
                    </span>
                  </span>
                ) : (
                  <span className="upp-new-member">New member</span>
                )}
              </div>

              <p>
                View their skills and start a SkillSwap request.
              </p>
            </div>
          </div>

          <div className="upp-summary-stats">
            <div className="upp-stat">
              <strong>{profile.teach_skills.length}</strong>
              <span>Teaching Skills</span>
            </div>

            <div className="upp-stat">
              <strong>{profile.learn_skills.length}</strong>
              <span>Learning Skills</span>
            </div>

            <div className="upp-stat">
              <strong>{verifiedCount}</strong>
              <span>Verified Skills</span>
            </div>
          </div>

          <div className="upp-profile-actions">
            <button
              type="button"
              className="upp-btn upp-btn-secondary"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("skillmatch-open-chat", {
                    detail: profile.user,
                  })
                )
              }
            >
              Message
            </button>

            <Link
              to={`/matches/${profile.user}/request`}
              className="upp-btn upp-btn-primary"
            >
              Send Request
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className="upp-about-card">
          <div className="upp-section-heading">
            <div>
              <h2>About {profile.username}</h2>
              <p>A little about who they are.</p>
            </div>
          </div>

          {profile.bio ? (
            <p className="upp-bio">{profile.bio}</p>
          ) : (
            <p className="upp-empty">No bio added yet.</p>
          )}
        </section>

        <div className="upp-skills-grid">
          <section className="upp-skill-card">
            <div className="upp-section-heading">
              <div>
                <h2>Skills {profile.username} Can Teach</h2>
                <p>Skills you can learn from this user.</p>
              </div>

              <span className="upp-count">
                {profile.teach_skills.length} Listed
              </span>
            </div>

            {profile.teach_skills.length === 0 ? (
              <p className="upp-empty">No teaching skills added yet.</p>
            ) : (
              <ul className="upp-skill-list">
                {profile.teach_skills.map((skill) => (
                  <li
                    key={skill.skill}
                    className={
                      skill.is_verified
                        ? "upp-skill-row verified"
                        : "upp-skill-row"
                    }
                  >
                    <div className="upp-skill-left">
                      <span className="upp-skill-initial">
                        {skill.skill_name.slice(0, 2)}
                      </span>

                      <span className="upp-skill-name">
                        {skill.skill_name}
                      </span>
                    </div>

                    <VerifiedBadge verified={skill.is_verified} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="upp-skill-card">
            <div className="upp-section-heading">
              <div>
                <h2>Skills {profile.username} Wants to Learn</h2>
                <p>Skills you may be able to teach in return.</p>
              </div>

              <span className="upp-count">
                {profile.learn_skills.length} Desired
              </span>
            </div>

            {profile.learn_skills.length === 0 ? (
              <p className="upp-empty">No learning skills added yet.</p>
            ) : (
              <ul className="upp-skill-list">
                {profile.learn_skills.map((skill) => (
                  <li key={skill.skill} className="upp-skill-row">
                    <div className="upp-skill-left">
                      <span className="upp-skill-initial">
                        {skill.skill_name.slice(0, 2)}
                      </span>

                      <span className="upp-skill-name">
                        {skill.skill_name}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
