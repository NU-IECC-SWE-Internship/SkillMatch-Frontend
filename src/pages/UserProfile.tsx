import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  getUserProfile,
  type PublicUserProfile,
} from '../api/profileApi';

import VerifiedBadge from '../components/VerifiedBadge';

import './profile.css';


export default function UserProfile() {
  const { userId } = useParams();

  const [profile, setProfile] =
    useState<PublicUserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


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

        setError(
          'Could not load user profile.'
        );
      })
      .finally(() => {
        setLoading(false);
      });

  }, [userId]);


  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-container">
          <div className="empty-state">
            Loading profile...
          </div>
        </div>
      </main>
    );
  }


  if (error) {
    return (
      <main className="profile-page">
        <div className="profile-container">
          <div className="empty-state">
            {error}
          </div>
        </div>
      </main>
    );
  }


  if (!profile) {
    return (
      <main className="profile-page">
        <div className="profile-container">
          <div className="empty-state">
            Profile not found.
          </div>
        </div>
      </main>
    );
  }


  return (
    <main className="profile-page">
      <div className="profile-container">

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <Link
            to="/matches"
            style={{
              textDecoration: 'none',
              color: '#4f46e5',
              fontWeight: 600,
            }}
          >
            ← Back to Matches
          </Link>

          <Link
            to="/dashboard"
            style={{
              textDecoration: 'none',
              color: '#2563eb',
              fontWeight: 600,
            }}
          >
            Dashboard →
          </Link>
        </div>


        <header className="profile-header">
          <div>
            <p className="small-title">
              SKILLMATCH
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <h1>
                {profile.username}
              </h1>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background:
                    'rgba(255, 255, 255, 0.95)',
                  padding:
                    '0.35rem 0.85rem',
                  borderRadius:
                    '20px',
                  boxShadow:
                    '0 2px 8px rgba(0,0,0,0.06)',
                  border:
                    '1px solid #e2e8f0',
                  fontSize:
                    '0.9rem',
                  fontWeight:
                    650,
                }}
              >
                {profile.rating_count > 0 ? (
                  <>
                    <span
                      style={{
                        color: '#f59e0b',
                        fontSize: '1.1rem',
                      }}
                    >
                      ★
                    </span>

                    <span
                      style={{
                        color: '#1e293b',
                        fontWeight: 700,
                      }}
                    >
                      {profile.rating_average.toFixed(1)}
                    </span>

                    <span
                      style={{
                        color: '#64748b',
                        fontSize: '0.8rem',
                      }}
                    >
                      (
                      {profile.rating_count}{' '}
                      {profile.rating_count === 1
                        ? 'review'
                        : 'reviews'}
                      )
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      color: '#2563eb',
                      fontSize: '0.82rem',
                    }}
                  >
                    ★ New Member
                  </span>
                )}
              </div>
            </div>

            <p>
              View {profile.username}'s
              skills and profile.
            </p>
          </div>
        </header>


        <section className="profile-card">
          <div className="section-heading">
            <h2>
              About Me
            </h2>

            <p>
              A little about {profile.username}.
            </p>
          </div>

          <p
            style={{
              margin: 0,
              color: '#475569',
              fontSize: '15px',
              lineHeight: 1.7,
            }}
          >
            {profile.bio ||
              'No bio added yet.'}
          </p>
        </section>


        <section className="public-skills-section">
          <div className="public-skills-heading">
            <span className="public-section-label">
              SKILLS & INTERESTS
            </span>

            <h2>
              What {profile.username} brings
              to SkillMatch
            </h2>

            <p>
              Explore the skills they can
              share and what they want to
              learn next.
            </p>
          </div>


          <div className="public-skills-layout">

            <div className="public-skill-panel teaching-panel">

              <div className="public-panel-header">
                <div className="public-panel-icon">
                  🎓
                </div>

                <div>
                  <h3>
                    Teaching Toolkit
                  </h3>

                  <p>
                    {profile.teach_skills.length}{' '}
                    {profile.teach_skills.length === 1
                      ? 'skill'
                      : 'skills'}{' '}
                    available
                  </p>
                </div>
              </div>


              {profile.teach_skills.length === 0 ? (
                <div className="public-skills-empty">
                  No teaching skills added yet.
                </div>
              ) : (
                <div className="public-skill-list">
                  {profile.teach_skills.map(
                    (skill) => (
                      <div
                        key={skill.skill}
                        className={
                          skill.is_verified
                            ? 'public-skill-item verified-public-skill'
                            : 'public-skill-item'
                        }
                      >
                        <div className="public-skill-name">
                          {skill.skill_name}
                        </div>

                        {skill.is_verified && (
                          <VerifiedBadge
                            verified={
                              skill.is_verified
                            }
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

            </div>


            <div className="public-skill-panel learning-panel">

              <div className="public-panel-header">
                <div className="public-panel-icon">
                  ✨
                </div>

                <div>
                  <h3>
                    Learning Wishlist
                  </h3>

                  <p>
                    {profile.learn_skills.length}{' '}
                    {profile.learn_skills.length === 1
                      ? 'skill'
                      : 'skills'}{' '}
                    to explore
                  </p>
                </div>
              </div>


              {profile.learn_skills.length === 0 ? (
                <div className="public-skills-empty">
                  No learning skills added yet.
                </div>
              ) : (
                <div className="public-skill-list">
                  {profile.learn_skills.map(
                    (skill) => (
                      <div
                        key={skill.skill}
                        className="public-skill-item learning-skill-item"
                      >
                        <div className="public-skill-name">
                          {skill.skill_name}
                        </div>

                        <span className="learning-arrow">
                          ↗
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}

            </div>

          </div>
        </section>


        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '26px',
            marginBottom: '40px',
          }}
        >
          <Link
  to={`/matches/${profile.user}/request`}
  className="primary-button"
  style={{
    textDecoration: 'none',
    display: 'inline-block',
  }}
>
  Send a Request
</Link>
        </div>

      </div>
    </main>
  );
}