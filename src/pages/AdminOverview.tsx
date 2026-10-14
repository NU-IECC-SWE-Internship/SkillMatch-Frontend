import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAdminOverview, type AdminOverview as Overview } from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import { ColumnChart, DonutChart, PairedBars, RingGauge, Sparkline } from "../components/admin/AdminCharts";
import { AlertIcon } from "../components/admin/AdminIcons";
import { PERIOD_OPTIONS, formatDate, initials, isPeriod, timeAgo } from "../components/admin/adminFormat";
import UserStatusBadge from "../components/admin/UserStatusBadge";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

const COLORS = {
  blue: "#2563eb",
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#94a3b8",
  violet: "#8b5cf6",
};

function percent(part: number, whole: number) {
  return whole ? (part / whole) * 100 : 0;
}

function parseBucket(value: string) {
  return new Date(value.length === 10 ? `${value}T00:00:00` : value);
}

function signupColumns(data: Overview) {
  const points = data.signups.map((point) => ({ ...point, at: parseBucket(point.date) }));
  const spansYears = new Set(points.map((point) => point.at.getFullYear())).size > 1;
  const plural = (count: number) => `${count} sign-up${count === 1 ? "" : "s"}`;

  return points.map(({ at, count }, index) => {
    if (data.signups_unit === "hour") {
      const hour = at.toLocaleTimeString(undefined, { hour: "numeric" });
      return { label: index % 3 === 0 ? hour : "", value: count, tooltip: `${hour}: ${plural(count)}` };
    }
    if (data.signups_unit === "month") {
      const month = at.toLocaleDateString(undefined, { month: "short" });
      const showYear = spansYears && (index === 0 || at.getMonth() === 0);
      return {
        label: showYear ? `${month} ${String(at.getFullYear()).slice(2)}` : month,
        value: count,
        tooltip: `${at.toLocaleDateString(undefined, { month: "long", year: "numeric" })}: ${plural(count)}`,
      };
    }
    const fullDate = at.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const day = at.getDate();
    const label =
      points.length <= 7
        ? at.toLocaleDateString(undefined, { weekday: "short" })
        : day === 1 || day % 5 === 0
          ? String(day)
          : "";
    return { label, value: count, tooltip: `${fullDate}: ${plural(count)}` };
  });
}

function signupMeta(data: Overview, total: number) {
  const count = `${total} sign-up${total === 1 ? "" : "s"}`;
  switch (data.period) {
    case "today":
      return `${count} today · by hour`;
    case "week":
      return `${count} this week · by day`;
    case "month":
      return `${count} this month · by day`;
    default:
      return `${count} · last ${data.signups.length} month${data.signups.length === 1 ? "" : "s"}`;
  }
}

function KpiCard({
  to,
  label,
  value,
  caption,
  visual,
}: {
  to: string;
  label: string;
  value: ReactNode;
  caption: ReactNode;
  visual: ReactNode;
}) {
  return (
    <Link to={to} className="admin-kpi">
      <div className="admin-kpi-text">
        <span className="admin-kpi-label">{label}</span>
        <strong className="admin-kpi-value">{value}</strong>
        <span className="admin-kpi-caption">{caption}</span>
      </div>
      <div className="admin-kpi-visual">{visual}</div>
    </Link>
  );
}

function ChartPanel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <section className="admin-panel admin-chart-panel">
      <div className="admin-panel-header">
        <h2>{title}</h2>
        {meta ? <span className="admin-panel-meta">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

function OverviewContent() {
  const [params, setParams] = useSearchParams();
  const rawPeriod = params.get("period");
  const period = rawPeriod === "all" ? "" : isPeriod(rawPeriod) ? rawPeriod : "week";

  const [result, setResult] = useState<{ period: string; data: Overview } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminOverview(period)
      .then((data) => {
        if (cancelled) return;
        setError(null);
        setResult({ period, data });
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  function selectPeriod(value: string) {
    const next = new URLSearchParams(params);
    if (value === "week") next.delete("period");
    else next.set("period", value || "all");
    setParams(next, { replace: true });
  }

  if (error && !result) {
    return (
      <p className="admin-skills-error" role="alert">
        {error}
      </p>
    );
  }
  if (!result) return <p className="admin-skills-status">Loading overview...</p>;

  const { data } = result;
  const loading = result.period !== period;
  const { users, skills, activity } = data;
  const quizzes = activity.quizzes;
  const periodLabel = PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "";
  const lowerLabel = period ? periodLabel.toLowerCase() : "in total";
  const usersQuery = period ? `&joined=${period}` : "";

  const signupTotal = data.signups.reduce((sum, point) => sum + point.count, 0);

  return (
    <div className="admin-overview" style={{ opacity: loading ? 0.6 : 1 }}>
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

      <div className="admin-period-bar">
        <div className="admin-skills-tabs" role="tablist" aria-label="Time period">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              role="tab"
              aria-selected={period === option.value}
              className={period === option.value ? "admin-tab active" : "admin-tab"}
              onClick={() => selectPeriod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="admin-period-since">
          {data.since ? `Since ${formatDate(data.since)}` : "Since SkillMatch started"}
        </span>
      </div>

      <div className="admin-kpi-grid">
        <KpiCard
          to={`/admin/users?sort=newest${usersQuery}`}
          label="New members"
          value={activity.new_users}
          caption={`Signed up ${lowerLabel}`}
          visual={<Sparkline values={data.signups.map((day) => day.count)} color={COLORS.blue} />}
        />
        <KpiCard
          to={`/admin/users?sort=last_login${period ? `&seen=${period}` : ""}`}
          label="Signed in"
          value={activity.signed_in}
          caption={`of ${users.total} users`}
          visual={<RingGauge value={percent(activity.signed_in, users.total)} color={COLORS.green} />}
        />
        <KpiCard
          to="/admin/users"
          label="Meetings booked"
          value={activity.meetings_booked}
          caption={`${activity.meetings_completed} completed`}
          visual={<RingGauge value={percent(activity.meetings_completed, activity.meetings_booked)} color={COLORS.violet} />}
        />
        <KpiCard
          to="/admin/skills"
          label="Quiz pass rate"
          value={quizzes.attempts}
          caption={`attempts ${lowerLabel}`}
          visual={<RingGauge value={percent(quizzes.passed, quizzes.attempts)} color={COLORS.amber} />}
        />
      </div>

      <div className="admin-grid-2 wide-left">
        <ChartPanel title="New sign-ups" meta={signupMeta(data, signupTotal)}>
          <ColumnChart data={signupColumns(data)} color="linear-gradient(180deg, #3b82f6, #0a4ac6)" />
        </ChartPanel>
        <ChartPanel title="Quiz results" meta={periodLabel}>
          <DonutChart
            centerLabel="attempts"
            segments={[
              { label: "Passed", value: quizzes.passed, color: COLORS.green },
              { label: "Failed", value: quizzes.failed, color: COLORS.red },
              { label: "Left early", value: quizzes.abandoned, color: COLORS.slate },
            ]}
          />
        </ChartPanel>
      </div>

      <div className="admin-grid-2">
        <ChartPanel title="Most popular skills" meta={`${skills.approved} approved · ${skills.verified_teachers} verified teachers`}>
          {data.top_skills.length === 0 ? (
            <p className="admin-empty">No one has added skills yet.</p>
          ) : (
            <PairedBars
              series={["Can teach", "Want to learn"]}
              rows={data.top_skills.map((skill) => ({
                key: skill.id,
                label: <Link to={`/admin/skills/${skill.id}/questions`}>{skill.name}</Link>,
                values: [skill.teachers, skill.learners],
              }))}
            />
          )}
        </ChartPanel>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Newest members</h2>
            <Link to="/admin/users" className="admin-panel-link">
              View all
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
    </div>
  );
}

export default function AdminOverview() {
  return (
    <AdminLayout title="Overview" subtitle="What's happening on SkillMatch at a glance.">
      <OverviewContent />
    </AdminLayout>
  );
}
