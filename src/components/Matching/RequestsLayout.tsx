import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import UserRatingBadge from "./UserRatingBadge";

export function RequestsHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <div className="requests-topbar">
        <Link to="/dashboard" className="requests-nav-link">
          &larr; Dashboard
        </Link>

        <Link to="/skillbrowse" className="requests-nav-link">
          Browse Skills &rarr;
        </Link>
      </div>

      <header className="requests-header fx-hero fx-glow fx-rise">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      <nav className="requests-tabs fx-rise fx-d1">
        <NavLink
          to="/requests"
          className={({ isActive }) =>
            isActive ? "requests-tab active" : "requests-tab"
          }
        >
          Incoming
        </NavLink>

        <NavLink
          to="/my-requests"
          className={({ isActive }) =>
            isActive ? "requests-tab active" : "requests-tab"
          }
        >
          Sent by me
        </NavLink>
      </nav>
    </>
  );
}

export function RequestSection({
  title,
  count,
  hint,
  highlight = false,
  children,
}: {
  title: string;
  count?: number;
  hint?: string;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="requests-group fx-rise fx-d2">
      <div className="group-head">
        <h2 className="group-title">{title}</h2>
        {count !== undefined && (
          <span className={highlight && count > 0 ? "group-count hot" : "group-count"}>
            {count}
          </span>
        )}
      </div>

      {hint && <p className="group-hint">{hint}</p>}

      {children}
    </section>
  );
}

export type StatusTone = "pending" | "action" | "success" | "danger";

export function StatusChip({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return <span className={`status-chip status-chip-${tone}`}>{children}</span>;
}

export function PersonHeader({
  userId,
  username,
  ratingAverage,
  ratingCount,
  subtitle,
  status,
  muted = false,
}: {
  userId: number;
  username: string;
  ratingAverage?: number;
  ratingCount?: number;
  subtitle?: ReactNode;
  status?: ReactNode;
  muted?: boolean;
}) {
  const initial = username ? username.charAt(0).toUpperCase() : "?";

  return (
    <div className="incoming-card-top">
      <Link
        to={`/users/${userId}`}
        className={muted ? "sender-avatar muted" : "sender-avatar"}
      >
        {initial}
      </Link>

      <div className="sender-info">
        <div className="sender-title-rating">
          <Link to={`/users/${userId}`} className="sender-name">
            {username}
          </Link>

          <UserRatingBadge
            ratingAverage={ratingAverage}
            ratingCount={ratingCount}
          />
        </div>

        {subtitle && <span className="request-tag">{subtitle}</span>}
      </div>

      {status && <div className="incoming-card-status">{status}</div>}
    </div>
  );
}
