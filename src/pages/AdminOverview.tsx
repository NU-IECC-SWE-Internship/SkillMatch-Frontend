import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { getAdminOverview, type AdminOverview as Overview } from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import {
  ActivityIcon,
  AlertIcon,
  HourglassIcon,
  UsersIcon,
  VerifiedIcon,
} from "../components/admin/AdminIcons";
import { initials, timeAgo } from "../components/admin/adminFormat";
import UserStatusBadge from "../components/admin/UserStatusBadge";
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

const QUIZ_SEGMENTS = [
  { key: "passed", label: "Passed", color: "#16a34a" },
  { key: "failed", label: "Failed", color: "#dc2626" },
  { key: "abandoned", label: "Abandoned", color: "#d97706" },
] as const;

function accent(color: string) {
  return { "--accent": color } as CSSProperties;
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function sum(values: Partial<Record<string, number>>) {
  return Object.values(values).reduce<number>((total, value) => total + (value ?? 0), 0);
}

function StatCard({
  to,
  color,
  icon,
  label,
  value,
  hint,
}: {
  to?: string;
  color: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: ReactNode;
}) {
  const body = (
    <>
      <div className="admin-stat-top">
        <span className="admin-stat-label">{label}</span>
        <span className="admin-stat-icon">{icon}</span>
      </div>
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-hint">{hint}</div>
    </>
  );
  return to ? (
    <Link to={to} className="admin-stat-card" style={accent(color)}>
      {body}
    </Link>
  ) : (
    <div className="admin-stat-card" style={accent(color)}>
      {body}
    </div>
  );
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

function SignupChart({ days }: { days: Overview["signups"] }) {
  const max = Math.max(1, ...days.map((day) => day.count));
  const total = days.reduce((count, day) => count + day.count, 0);
  const label = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <h2>New sign-ups</h2>
        <span className="admin-panel-meta">{plural(total, "user")} in the last 14 days</span>
      </div>
      <div className="admin-chart" role="img" aria-label={`${total} sign-ups in the last 14 days`}>
        {days.map((day, index) => (
          <div key={day.date} className="admin-chart-col" title={`${label(day.date)}: ${plural(day.count, "sign-up")}`}>
            <span className="admin-chart-value">{day.count || ""}</span>
            <div className="admin-chart-bar-wrap">
              <div
                className={day.count ? "admin-chart-bar" : "admin-chart-bar empty"}
                style={{ height: `${(day.count / max) * 100}%` }}
              />
            </div>
            <span className="admin-chart-label">
              {index === 0 || index === days.length - 1 || index % 3 === 0 ? label(day.date) : ""}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuizPanel({ quiz }: { quiz: Overview["quizzes_this_week"] }) {
  const passRate = quiz.attempts ? Math.round((quiz.passed / quiz.attempts) * 100) : 0;
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <h2>Skill quizzes this week</h2>
        <span className="admin-panel-meta">{plural(quiz.attempts, "attempt")}</span>
      </div>
      {quiz.attempts === 0 ? (
        <p className="admin-empty">No quizzes taken in the last 7 days.</p>
      ) : (
        <>
          <div className="admin-quiz-rate">
            <strong>{passRate}%</strong>
            <span>pass rate</span>
          </div>
          <div className="admin-stacked-bar" aria-hidden="true">
            {QUIZ_SEGMENTS.map((segment) =>
              quiz[segment.key] ? (
                <div
                  key={segment.key}
                  style={{ width: `${(quiz[segment.key] / quiz.attempts) * 100}%`, background: segment.color }}
                />
              ) : null,
            )}
          </div>
          <ul className="admin-legend">
            {QUIZ_SEGMENTS.map((segment) => (
              <li key={segment.key}>
                <span className="admin-legend-dot" style={{ background: segment.color }} />
                {segment.label}
                <strong>{quiz[segment.key]}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function TopSkills({ skills }: { skills: Overview["top_skills"] }) {
  const max = Math.max(1, ...skills.map((skill) => Math.max(skill.teachers, skill.learners)));
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <h2>Most popular skills</h2>
        <Link to="/admin/skills" className="admin-panel-link">
          All skills
        </Link>
      </div>
      {skills.length === 0 ? (
        <p className="admin-empty">No one has added skills yet.</p>
      ) : (
        <>
          <ul className="admin-legend compact">
            <li>
              <span className="admin-legend-dot" style={{ background: "#2563eb" }} />
              Can teach
            </li>
            <li>
              <span className="admin-legend-dot" style={{ background: "#a78bfa" }} />
              Want to learn
            </li>
          </ul>
          <ul className="admin-list">
            {skills.map((skill) => (
              <li key={skill.id} className="admin-skill-demand">
                <div className="admin-skill-demand-head">
                  <Link to={`/admin/skills/${skill.id}/questions`}>
                    <strong>{skill.name}</strong>
                  </Link>
                  {skill.learners > skill.teachers ? (
                    <span className="admin-badge amber" title="More people want to learn this than can teach it">
                      Needs teachers
                    </span>
                  ) : null}
                  <span className="admin-muted">
                    {skill.verified}/{skill.teachers} verified
                  </span>
                </div>
                <div className="admin-demand-bars">
                  <div className="admin-demand-row" title={`${plural(skill.teachers, "teacher")}`}>
                    <div className="admin-demand-fill teach" style={{ width: `${(skill.teachers / max) * 100}%` }} />
                    <span>{skill.teachers}</span>
                  </div>
                  <div className="admin-demand-row" title={`${plural(skill.learners, "learner")}`}>
                    <div className="admin-demand-fill learn" style={{ width: `${(skill.learners / max) * 100}%` }} />
                    <span>{skill.learners}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
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

  const { users, skills } = data;
  const activeShare = users.total ? Math.round((users.logged_in_this_week / users.total) * 100) : 0;

  return (
    <>
      {skills.pending > 0 ? (
        <div className="admin-attention" role="status">
          <AlertIcon />
          <div className="admin-attention-text">
            <strong>
              {skills.pending} skill{skills.pending === 1 ? " is" : "s are"} waiting for your approval
            </strong>
            <span>They stay hidden from other users until you approve them.</span>
          </div>
          <Link to="/admin/skills" className="admin-secondary-btn">
            Review now
          </Link>
        </div>
      ) : null}

      <div className="admin-stat-grid">
        <StatCard
          to="/admin/users"
          color="#2563eb"
          icon={<UsersIcon />}
          label="Total users"
          value={users.total}
          hint={
            users.new_this_week ? (
              <span className="admin-trend-up">+{users.new_this_week} this week</span>
            ) : (
              "No new sign-ups this week"
            )
          }
        />
        <StatCard
          to="/admin/users?sort=last_login"
          color="#16a34a"
          icon={<ActivityIcon />}
          label="Signed in this week"
          value={users.logged_in_this_week}
          hint={`${activeShare}% of all accounts`}
        />
        <StatCard
          to="/admin/users?status=onboarding"
          color="#d97706"
          icon={<HourglassIcon />}
          label="Still onboarding"
          value={users.onboarding}
          hint="Signed up but profile not finished"
        />
        <StatCard
          to="/admin/skills"
          color="#7c3aed"
          icon={<VerifiedIcon />}
          label="Verified teachers"
          value={skills.verified_teachers}
          hint={`${plural(skills.approved, "approved skill")}${skills.pending ? ` · ${skills.pending} pending` : ""}`}
        />
      </div>

      <div className="admin-grid-2 wide-left">
        <SignupChart days={data.signups} />
        <QuizPanel quiz={data.quizzes_this_week} />
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Meetings</h2>
            <span className="admin-panel-meta">{sum(data.meetings)} total</span>
          </div>
          <BarList rows={MEETING_ROWS} values={data.meetings} />
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Swap requests</h2>
            <span className="admin-panel-meta">{sum(data.requests)} total</span>
          </div>
          <BarList rows={REQUEST_ROWS} values={data.requests} />
        </section>
      </div>

      <div className="admin-grid-2">
        <TopSkills skills={data.top_skills} />

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
                    <span>
                      @{user.username} · joined {timeAgo(user.date_joined)}
                    </span>
                  </Link>
                  {user.is_staff ? <span className="admin-badge purple">Admin</span> : null}
                  <UserStatusBadge
                    isActive={user.is_active}
                    isStaff={user.is_staff}
                    onboardingCompleted={user.onboarding_completed}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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
