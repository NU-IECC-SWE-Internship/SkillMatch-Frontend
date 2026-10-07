import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getAdminOverview, type AdminOverview as Overview } from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import { initials, timeAgo } from "../components/admin/adminFormat";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

const MEETING_ROWS = [
  { key: "SCHEDULED", label: "Scheduled", color: "#2563eb" },
  { key: "COMPLETED", label: "Completed", color: "#16a34a" },
  { key: "MISSED", label: "Missed", color: "#d97706" },
  { key: "CANCELLED", label: "Cancelled", color: "#dc2626" },
] as const;

const REQUEST_ROWS = [
  { key: "PENDING", label: "Pending", color: "#d97706" },
  { key: "ACCEPTED", label: "Accepted", color: "#16a34a" },
  { key: "REJECTED", label: "Rejected", color: "#dc2626" },
  { key: "CANCELLED", label: "Cancelled", color: "#64748b" },
] as const;

function accent(color: string) {
  return { "--accent": color } as CSSProperties;
}

function BarList({
  rows,
  values,
}: {
  rows: readonly { key: string; label: string; color: string }[];
  values: Partial<Record<string, number>>;
}) {
  const max = Math.max(1, ...rows.map((row) => values[row.key] ?? 0));
  return (
    <>
      {rows.map((row) => {
        const value = values[row.key] ?? 0;
        return (
          <div key={row.key} className="admin-bar-row" style={accent(row.color)}>
            <span>{row.label}</span>
            <div className="admin-bar-track">
              <div className="admin-bar-fill" style={{ width: `${(value / max) * 100}%` }} />
            </div>
            <span className="admin-bar-value">{value}</span>
          </div>
        );
      })}
    </>
  );
}

function OverviewContent() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverview()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) {
    return (
      <p className="admin-skills-error" role="alert">
        {error}
      </p>
    );
  }
  if (!data) return <p className="admin-skills-status">Loading overview...</p>;

  const quiz = data.quizzes_this_week;
  const passRate = quiz.attempts ? Math.round((quiz.passed / quiz.attempts) * 100) : 0;

  return (
    <>
      <div className="admin-stat-grid">
        <Link to="/admin/users" className="admin-stat-card" style={accent("#2563eb")}>
          <div className="admin-stat-label">Total users</div>
          <div className="admin-stat-value">{data.users.total}</div>
          <div className="admin-stat-hint">+{data.users.new_this_week} this week</div>
        </Link>
        <Link to="/admin/users?status=active" className="admin-stat-card" style={accent("#16a34a")}>
          <div className="admin-stat-label">Active accounts</div>
          <div className="admin-stat-value">{data.users.active}</div>
          <div className="admin-stat-hint">{data.users.staff} admin{data.users.staff === 1 ? "" : "s"}</div>
        </Link>
        <Link to="/admin/skills" className="admin-stat-card" style={accent("#d97706")}>
          <div className="admin-stat-label">Skills awaiting approval</div>
          <div className="admin-stat-value">{data.skills.pending}</div>
          <div className="admin-stat-hint">{data.skills.approved} approved skills</div>
        </Link>
        <div className="admin-stat-card" style={accent("#7c3aed")}>
          <div className="admin-stat-label">Quizzes this week</div>
          <div className="admin-stat-value">{quiz.attempts}</div>
          <div className="admin-stat-hint">
            {passRate}% pass rate · {data.skills.verified_teachers} verified teachers
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Meetings</h2>
          </div>
          <BarList rows={MEETING_ROWS} values={data.meetings} />
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Swap requests</h2>
          </div>
          <BarList rows={REQUEST_ROWS} values={data.requests} />
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <h2>Newest members</h2>
          <Link to="/admin/users" className="admin-panel-link">
            View all users
          </Link>
        </div>
        {data.recent_users.length === 0 ? (
          <p className="admin-empty">No users yet.</p>
        ) : (
          <ul className="admin-list">
            {data.recent_users.map((user) => (
              <li key={user.id} className="admin-list-item">
                <span className="admin-avatar">{initials(user.name)}</span>
                <Link to={`/admin/users/${user.id}`} className="admin-list-main">
                  <strong>{user.name}</strong>
                  <span>@{user.username}</span>
                </Link>
                {user.is_staff ? <span className="admin-badge purple">Admin</span> : null}
                <span className="admin-muted">{timeAgo(user.date_joined)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AdminOverview() {
  return (
    <AdminLayout title="Overview" subtitle="A quick look at what's happening on SkillMatch.">
      <OverviewContent />
    </AdminLayout>
  );
}
