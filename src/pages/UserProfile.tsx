import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  getMySkills,
  getUserProfile,
  type PublicUserProfile,
} from "../api/profileApi";

import VerifiedBadge from "../components/VerifiedBadge";

import "./ProfileRedesign.css";

const SKILL_PREVIEW = 6;

type ProfileSkill = PublicUserProfile["teach_skills"][number];

// Shows the first few skills with a "Show all" toggle; `tagged` skills get a note
// (e.g. "You want this" when they teach something you want to learn).
function SkillList({
  skills,
  emptyText,
  showVerified,
  tagged,
  tagText,
}: {
  skills: ProfileSkill[];
  emptyText: string;
  showVerified: boolean;
  tagged: Set<string>;
  tagText: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (skills.length === 0) {
    return <p className="upp-empty">{emptyText}</p>;
  }

  const shown = expanded ? skills : skills.slice(0, SKILL_PREVIEW);
  const hidden = skills.length - SKILL_PREVIEW;

  return (
    <>
      <ul className="upp-skill-list">
        {shown.map((skill) => (
          <li
            key={skill.skill}
            className={
              showVerified && skill.is_verified
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

              {tagged.has(skill.skill_name.toLowerCase()) && (
                <span className="upp-skill-tag">{tagText}</span>
              )}
            </div>

            {showVerified && <VerifiedBadge verified={skill.is_verified} />}
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          className="upp-show-all"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : `Show all ${skills.length} skills`}
        </button>
      )}
    </>
  );
}

export default function UserProfile() {
  const { userId } = useParams();
  const location = useLocation();

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
  // Your own skills (lower-cased names), to point out overlaps with this person
  const [myLearn, setMyLearn] = useState<Set<string>>(new Set());
  const [myTeach, setMyTeach] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getMySkills()
      .then((skills) => {
        if (cancelled) return;
        const names = (type: string) =>
          new Set(skills.filter((s) => s.skill_type === type).map((s) => s.skill_name.toLowerCase()));
        setMyLearn(names("learn"));
        setMyTeach(names("teach"));
      })
      .catch(() => {
        // Optional extra; the profile still works without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);
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
  if (loading || error || !profile) {
    return (
      <main className="upp-page">

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
                View their skills and start a SkillMatch request.
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

            <SkillList
              skills={profile.teach_skills}
              emptyText="No teaching skills added yet."
              showVerified
              tagged={myLearn}
              tagText="You want this"
            />
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

            <SkillList
              skills={profile.learn_skills}
              emptyText="No learning skills added yet."
              showVerified={false}
              tagged={myTeach}
              tagText="You teach this"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
