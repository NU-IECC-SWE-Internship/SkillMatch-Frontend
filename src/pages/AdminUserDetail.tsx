import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAdminUser,
  updateAdminUser,
  type AdminUserDetail as UserDetail,
  type MeetingStatus,
} from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import { formatDate, formatDateTime, initials, timeAgo } from "../components/admin/adminFormat";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

const MEETING_BADGE: Record<MeetingStatus, string> = {
  SCHEDULED: "blue",
  COMPLETED: "green",
  MISSED: "amber",
  CANCELLED: "red",
};

function sumValues(values: Partial<Record<string, number>>) {
  return Object.values(values).reduce<number>((total, value) => total + (value ?? 0), 0);
}

function UserDetailContent({
  user,
  onChange,
}: {
  user: UserDetail;
  onChange: (user: UserDetail) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const name = user.full_name || user.username;
  const teach = user.skills.filter((s) => s.type === "teach");
  const learn = user.skills.filter((s) => s.type === "learn");

  async function apply(
    changes: Partial<Pick<UserDetail, "is_active" | "is_staff">>,
    confirmText: string,
    doneText: string,
  ) {
    if (!window.confirm(confirmText)) return;
    try {
      setBusy(true);
      setError(null);
      onChange(await updateAdminUser(user.id, changes));
      setMessage(doneText);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link to="/admin/users" className="admin-back-link">
        &larr; All users
      </Link>

      {message ? <p className="admin-skills-message">{message}</p> : null}
      {error ? (
        <p className="admin-skills-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="admin-panel">
        <div className="admin-profile-head">
          <span className="admin-avatar large">{initials(name)}</span>
          <div>
            <h2>{name}</h2>
            <div className="admin-profile-meta">
              <span>@{user.username}</span>
              {user.email ? <span>{user.email}</span> : null}
              <span>Joined {formatDate(user.date_joined)}</span>
              <span>Last login {timeAgo(user.last_login)}</span>
            </div>
            <div className="admin-profile-badges">
              {user.is_superuser ? (
                <span className="admin-badge purple">Superuser</span>
              ) : user.is_staff ? (
                <span className="admin-badge purple">Admin</span>
              ) : (
                <span className="admin-badge">Member</span>
              )}
              {user.is_active ? (
                <span className="admin-badge green">Active</span>
              ) : (
                <span className="admin-badge red">Deactivated</span>
              )}
              {!user.is_staff && !user.onboarding_completed ? (
                <span className="admin-badge amber">Onboarding not finished</span>
              ) : null}
              {user.rating_count ? (
                <span className="admin-badge blue">
                  ★ {user.rating_average.toFixed(1)} from {user.rating_count} review
                  {user.rating_count === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="admin-profile-actions">
            {user.is_active ? (
              <button
                type="button"
                className="admin-deny-btn"
                disabled={busy}
                onClick={() =>
                  apply(
                    { is_active: false },
                    `Deactivate ${name}? They won't be able to log in.`,
                    "Account deactivated.",
                  )
                }
              >
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                className="admin-approve-btn"
                disabled={busy}
                onClick={() =>
                  apply({ is_active: true }, `Reactivate ${name}?`, "Account reactivated.")
                }
              >
                Reactivate
              </button>
            )}
            <button
              type="button"
              className="admin-secondary-btn"
              disabled={busy}
              onClick={() =>
                user.is_staff
                  ? apply(
                      { is_staff: false },
                      `Remove admin access from ${name}?`,
                      "Admin access removed.",
                    )
                  : apply(
                      { is_staff: true },
                      `Give ${name} full admin access?`,
                      "User is now an admin.",
                    )
              }
            >
              {user.is_staff ? "Remove admin" : "Make admin"}
            </button>
          </div>
        </div>

        {user.bio ? <p className="admin-profile-bio">{user.bio}</p> : null}
      </section>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Requests sent</div>
          <div className="admin-stat-value">{user.stats.requests_sent}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Requests received</div>
          <div className="admin-stat-value">{user.stats.requests_received}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Meetings</div>
          <div className="admin-stat-value">{sumValues(user.stats.meetings)}</div>
          <div className="admin-stat-hint">{user.stats.meetings.COMPLETED ?? 0} completed</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Quiz attempts</div>
          <div className="admin-stat-value">{user.stats.quiz_attempts}</div>
          <div className="admin-stat-hint">{user.verified_count} verified skill(s)</div>
        </div>
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Skills</h2>
          </div>
          <h3 className="admin-subheading">Teaches</h3>
          {teach.length ? (
            <div className="admin-chip-list">
              {teach.map((skill) => (
                <span key={skill.id} className="admin-skill-chip">
                  {skill.name}
                  {skill.is_verified ? <span className="verified">✓ verified</span> : null}
                </span>
              ))}
            </div>
          ) : (
            <p className="admin-empty">No teaching skills.</p>
          )}
          <h3 className="admin-subheading">Wants to learn</h3>
          {learn.length ? (
            <div className="admin-chip-list">
              {learn.map((skill) => (
                <span key={skill.id} className="admin-skill-chip">
                  {skill.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="admin-empty">No learning skills.</p>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent quiz attempts</h2>
          </div>
          {user.quiz_attempts.length ? (
            <ul className="admin-list">
              {user.quiz_attempts.map((attempt) => (
                <li key={attempt.id} className="admin-list-item">
                  <div className="admin-list-main">
                    <strong>{attempt.skill}</strong>
                    <span>{formatDateTime(attempt.created_at)}</span>
                  </div>
                  <span className="admin-muted">Score {attempt.score}</span>
                  {attempt.abandoned ? (
                    <span className="admin-badge amber">Abandoned</span>
                  ) : attempt.passed ? (
                    <span className="admin-badge green">Passed</span>
                  ) : (
                    <span className="admin-badge red">Failed</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No quiz attempts yet.</p>
          )}
        </section>
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent meetings</h2>
          </div>
          {user.meetings.length ? (
            <ul className="admin-list">
              {user.meetings.map((meeting) => (
                <li key={meeting.id} className="admin-list-item">
                  <div className="admin-list-main">
                    <strong>
                      {meeting.skill} with {meeting.partner}
                    </strong>
                    <span>{formatDateTime(meeting.start_time)}</span>
                  </div>
                  <span className={`admin-badge ${MEETING_BADGE[meeting.status]}`}>
                    {meeting.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No meetings yet.</p>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Reviews received</h2>
          </div>
          {user.reviews.length ? (
            <ul className="admin-list">
              {user.reviews.map((review) => (
                <li key={review.id} className="admin-list-item">
                  <div className="admin-list-main">
                    <strong>
                      {"★".repeat(review.score)}
                      <span className="admin-muted">{"★".repeat(5 - review.score)}</span>{" "}
                      · {review.reviewer}
                    </strong>
                    <span>{review.feedback || "No written feedback."}</span>
                  </div>
                  <span className="admin-muted">{formatDate(review.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No reviews yet.</p>
          )}
        </section>
      </div>
    </>
  );
}

function UserDetailLoader({ userId }: { userId: number }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminUser(userId)
      .then(setUser)
      .catch((err) => setError(getErrorMessage(err)));
  }, [userId]);

  if (error) {
    return (
      <p className="admin-skills-error" role="alert">
        {error}
      </p>
    );
  }
  if (!user) return <p className="admin-skills-status">Loading user...</p>;
  return <UserDetailContent user={user} onChange={setUser} />;
}

export default function AdminUserDetail() {
  const userId = Number(useParams().userId);
  return (
    <AdminLayout title="User details" subtitle="Profile, activity and account controls.">
      <UserDetailLoader key={userId} userId={userId} />
    </AdminLayout>
  );
}
