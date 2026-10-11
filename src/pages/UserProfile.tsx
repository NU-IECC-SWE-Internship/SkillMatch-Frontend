import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import {
  getUserProfile,
  type PublicUserProfile,
} from '../api/profileApi';

import VerifiedBadge from '../components/VerifiedBadge';
import { handleCursorGlow } from '../lib/cursorGlow';

import './MyProfile.css';


export default function UserProfile() {
  const { userId } = useParams();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const fromPath = from?.split(/[?#]/, 1)[0];
  const backTo = from?.startsWith('/') && !from.startsWith('//')
    ? from
    : '/skillbrowse';
  const backLabel = fromPath === '/requests'
    ? 'Requests'
    : fromPath === '/my-requests'
      ? 'My Requests'
      : fromPath === '/dashboard'
        ? 'Dashboard'
        : 'Browse Skills';

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setError('User ID is missing.');
      setLoading(false);
      return;
    }

    const id = Number(userId);

    if (Number.isNaN(id)) {
      setError('Invalid user ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    getUserProfile(id)
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.error(err);
        setError('Could not load user profile.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);


  const nav = (
    <nav className="mp-nav">
      <Link to={backTo}>&larr; {backLabel}</Link>
      <Link to="/dashboard">Dashboard &rarr;</Link>
    </nav>
  );

  if (loading || error || !profile) {
    return (
      <main className="mp-page fx-backdrop">
        <div className="mp-container">
          {nav}
          {loading ? (
            <div className="mp-hero mp-skeleton" />
          ) : (
            <p className="mp-empty">{error || 'Profile not found.'}</p>
          )}
        </div>
      </main>
    );
  }

  const initial = profile.username
    ? profile.username.charAt(0).toUpperCase()
    : '?';

  const verifiedCount = profile.teach_skills.filter(
    (skill) => skill.is_verified
  ).length;

  return (
    <main className="mp-page fx-backdrop" onPointerMove={handleCursorGlow}>
      <div className="mp-container">
        {nav}

        <header className="mp-hero fx-glow fx-rise">
          <div className="mp-avatar">{initial}</div>

          <div className="mp-hero-info">
            <h1>{profile.username}</h1>

            <div className="mp-hero-meta">
              {profile.rating_count > 0 ? (
                <span className="mp-rating">
                  <span className="mp-star">★</span>
                  <strong>{profile.rating_average.toFixed(1)}</strong>
                  <span>
                    ({profile.rating_count}{' '}
                    {profile.rating_count === 1 ? 'review' : 'reviews'})
                  </span>
                </span>
              ) : (
                <span className="mp-rating new">★ New member</span>
              )}

              <span className="mp-dot" />
              <span>{profile.teach_skills.length} teaching</span>
              <span className="mp-dot" />
              <span>{profile.learn_skills.length} learning</span>
              {verifiedCount > 0 && (
                <>
                  <span className="mp-dot" />
                  <span>{verifiedCount} verified</span>
                </>
              )}
            </div>
          </div>

          <div className="mp-hero-actions">
            <button
              type="button"
              className="mp-btn mp-btn-ghost"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('skillmatch-open-chat', {
                    detail: profile.user,
                  })
                )
              }
            >
              Message
            </button>

            <Link
              to={`/matches/${profile.user}/request`}
              className="mp-btn mp-btn-light"
            >
              Send a request &rarr;
            </Link>
          </div>
        </header>

        <section className="mp-card fx-glow mp-theme-about">
          <div className="mp-card-head">
            <span className="mp-icon" aria-hidden="true">👋</span>
            <div className="mp-card-title">
              <h2>About {profile.username}</h2>
              <p>A little about who they are.</p>
            </div>
          </div>

          {profile.bio ? (
            <p className="mp-bio">{profile.bio}</p>
          ) : (
            <p className="mp-empty">No bio added yet.</p>
          )}
        </section>

        <div className="mp-grid">
          <section className="mp-card fx-glow mp-theme-teach">
            <div className="mp-card-head">
              <span className="mp-icon" aria-hidden="true">🎓</span>
              <div className="mp-card-title">
                <h2>Can teach</h2>
                <p>Skills {profile.username} can share with you.</p>
              </div>
              <span className="mp-count">{profile.teach_skills.length}</span>
            </div>

            {profile.teach_skills.length === 0 ? (
              <p className="mp-empty">No teaching skills added yet.</p>
            ) : (
              <ul className="mp-skill-list">
                {profile.teach_skills.map((skill) => (
                  <li
                    key={skill.skill}
                    className={
                      skill.is_verified
                        ? 'mp-skill-row verified'
                        : 'mp-skill-row'
                    }
                  >
                    <div className="mp-skill-main">
                      <span className="mp-skill-name">{skill.skill_name}</span>
                      <VerifiedBadge verified={skill.is_verified} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mp-card fx-glow mp-theme-learn">
            <div className="mp-card-head">
              <span className="mp-icon" aria-hidden="true">🌱</span>
              <div className="mp-card-title">
                <h2>Wants to learn</h2>
                <p>Teach one of these to set up a swap.</p>
              </div>
              <span className="mp-count">{profile.learn_skills.length}</span>
            </div>

            {profile.learn_skills.length === 0 ? (
              <p className="mp-empty">No learning skills added yet.</p>
            ) : (
              <ul className="mp-skill-list">
                {profile.learn_skills.map((skill) => (
                  <li key={skill.skill} className="mp-skill-row">
                    <div className="mp-skill-main">
                      <span className="mp-skill-name">{skill.skill_name}</span>
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
