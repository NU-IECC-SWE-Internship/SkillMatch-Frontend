import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api/profileApi";
import { getIncomingRequests, getMatches, getSentRequests } from "../api/matchingApi";
import type { MatchRequest } from "../api/matchingApi";
import { getMeetings } from "../api/meetingsApi";
import type { Meeting } from "../api/meetingsApi";
import { loadStaffRole } from "../lib/auth";
import "./Dashboard.css";

type FeatureIcon = "search" | "calendar" | "inbox";

type LiveCard = {
  key: string;
  icon: FeatureIcon;
  title: string;
  stat: string;
  description: string;
  action: string;
  to: string;
  live?: boolean;
  // Nothing to do right now ("Nothing scheduled", "All caught up"): grey badge, lighter button
  idle?: boolean;
};

const FIVE_MINUTES = 5 * 60 * 1000;

function formatWhen(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function partnerOf(meeting: Meeting) {
  return (
    meeting.partner_name ||
    (meeting.is_requester ? meeting.participant_b_name : meeting.participant_a_name) ||
    "your partner"
  );
}

function isLive(meeting: Meeting, now: number) {
  if (meeting.no_time_limit) return true;
  return now >= meeting.start_time_ts - FIVE_MINUTES && now <= meeting.end_time_ts;
}

function sessionCard(meetings: Meeting[]): LiveCard {
  const now = Date.now();
  const next = meetings
    .filter((m) => m.status === "SCHEDULED" && m.end_time_ts >= now)
    .sort((a, b) => a.start_time_ts - b.start_time_ts)[0];

  const base = { key: "session", icon: "calendar" as const, title: "Next Session" };

  if (!next) {
    return {
      ...base,
      stat: "Nothing scheduled",
      idle: true,
      description: "Accept a swap request to schedule your next session.",
      action: "View sessions",
      to: "/meetings",
    };
  }

  const what = `${next.skill_name ? `${next.skill_name} with ` : "With "}${partnerOf(next)}`;

  if (isLive(next, now)) {
    return {
      ...base,
      stat: "Live now",
      description: what,
      action: "Join call",
      to: `/meetings/${next.id}/room`,
      live: true,
    };
  }

  return {
    ...base,
    stat: formatWhen(next.start_time_ts),
    description: what,
    action: "View sessions",
    to: "/meetings",
  };
}

// Requests where it's this user's turn: receiver on PENDING/SCHEDULING, sender on CONFIRMING.
function requestsCard(incoming: MatchRequest[], sent: MatchRequest[]): LiveCard {
  const waiting =
    incoming.filter((r) => r.status === "PENDING" || r.status === "SCHEDULING").length +
    sent.filter((r) => r.status === "CONFIRMING").length;

  return {
    key: "requests",
    icon: "inbox",
    title: "Swap Requests",
    stat: waiting === 0 ? "All caught up" : `${waiting} waiting for you`,
    description:
      waiting === 0
        ? "No requests need your answer right now."
        : "People are waiting for you to accept, schedule or confirm.",
    action: waiting === 0 ? "View requests" : "Review requests",
    to: "/requests",
    idle: waiting === 0,
  };
}

function matchesCard(matchCount: number): LiveCard {
  return {
    key: "matches",
    icon: "search",
    title: "Your Matches",
    stat:
      matchCount === 0
        ? "No matches yet"
        : `${matchCount} ${matchCount === 1 ? "person matches" : "people match"} you`,
    description:
      matchCount === 0
        ? "Add skills you can teach and want to learn to find partners."
        : "They teach what you want to learn, and want to learn what you teach.",
    action: matchCount === 0 ? "Update your skills" : "Find partners",
    to: matchCount === 0 ? "/profile" : "/skillbrowse",
    idle: matchCount === 0,
  };
}

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
      <path
        d="M4 13h4l1.5 3h5L16 13h4M4 13l2.5-7h11L20 13v6H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<LiveCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
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
          return;
        }
      } catch {
        return;
      }

      // Each card loads on its own, so one failing API doesn't blank the others.
      const [meetings, incoming, sent, matches] = await Promise.all([
        getMeetings("all").catch(() => null),
        getIncomingRequests().catch(() => null),
        getSentRequests().catch(() => null),
        getMatches().catch(() => null),
      ]);

      if (cancelled) return;

      const unavailable = (key: string, icon: FeatureIcon, title: string, to: string): LiveCard => ({
        key,
        icon,
        title,
        stat: "Couldn't load",
        description: "Try refreshing the page.",
        action: "Open",
        to,
        idle: true,
      });

      setCards([
        meetings ? sessionCard(meetings) : unavailable("session", "calendar", "Next Session", "/meetings"),
        incoming && sent
          ? requestsCard(incoming, sent)
          : unavailable("requests", "inbox", "Swap Requests", "/requests"),
        matches ? matchesCard(matches.length) : unavailable("matches", "search", "Your Matches", "/skillbrowse"),
      ]);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="dashboard-page">
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
              <span>Right now</span>
              <h2>Your skill swaps at a glance</h2>
            </div>
          </div>

          <div className="dashboard-cards-grid">
            {cards === null
              ? ["session", "requests", "matches"].map((key) => (
                  <div key={key} className="dashboard-feature-card dashboard-card-loading" aria-hidden="true">
                    <span className="dashboard-card-icon" />
                    <span className="dashboard-skeleton" />
                    <span className="dashboard-skeleton short" />
                  </div>
                ))
              : cards.map((card) => (
                  <button
                    type="button"
                    key={card.key}
                    className={`dashboard-feature-card dashboard-card-${card.key}${card.live ? " live" : ""}`}
                    onClick={() => navigate(card.to)}
                  >
                    <div className="dashboard-card-head">
                      <span className="dashboard-card-icon">
                        <FeatureCardIcon type={card.icon} />
                      </span>
                      <h3>{card.title}</h3>
                    </div>

                    <div className="dashboard-card-content">
                      <strong
                        className={`dashboard-card-stat ${card.live ? "tone-live" : card.idle ? "tone-idle" : "tone-active"}`}
                      >
                        {card.live && <span className="dashboard-live-dot" aria-hidden="true" />}
                        {card.stat}
                      </strong>
                      <p>{card.description}</p>
                    </div>

                    <span className={card.idle ? "dashboard-card-action idle" : "dashboard-card-action"}>
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
