import { Link } from "react-router-dom";
import type { MatchRequest } from "../../api/matchingApi";
import UserRatingBadge from "./UserRatingBadge";

interface PastRequestCardProps {
  request: MatchRequest;
  sentByMe?: boolean;
}

export default function PastRequestCard({
  request,
  sentByMe = false,
}: PastRequestCardProps) {
  const username = sentByMe
    ? request.receiver_username
    : request.sender_username;

  const ratingAvg = sentByMe
    ? request.receiver_rating_average
    : request.sender_rating_average;

  const ratingCount = sentByMe
    ? request.receiver_rating_count
    : request.sender_rating_count;

  const initial = username
    ? username.charAt(0).toUpperCase()
    : "?";

  const selectedSkillName =
    request.receiver_skill_name === null || request.receiver_skill_name === undefined
      ? "None"
      : request.receiver_skill_name || request.skill_name;

  return (
    <div className="incoming-card past-card">
      <div className="incoming-card-top">
        <div className="sender-avatar muted">
          {initial}
        </div>

        <div>
          <div className="sender-title-rating">
            <h3 className="sender-name">
              {sentByMe ? `Request to ${username}` : username}
            </h3>
            <UserRatingBadge
              ratingAverage={ratingAvg}
              ratingCount={ratingCount}
            />
          </div>

          <span className="skill-pill pill-learn">
            {request.skill_name || `Skill #${request.skill}`}
          </span>
        </div>
      </div>

      {request.status === "ACCEPTED" && (
        <div className="rejection-reason">
          <span className="detail-label">
            Selected skill
          </span>

          <p>{selectedSkillName}</p>
        </div>
      )}

      {request.status === "REJECTED" && request.rejection_reason && (
        <div className="rejection-reason">
          <span className="detail-label">
            Reason for rejection
          </span>

          <p>{request.rejection_reason}</p>
        </div>
      )}

      {/* 2. Status badge & View Meeting link moved to the end */}
      <div
        className="status-badge-container"
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <span
          className={`status-tag status-${request.status.toLowerCase()}`}
        >
          {request.status}
        </span>

        {request.status === "ACCEPTED" && (
          <Link
            to="/meetings"
            className="view-meeting-link"
            style={{
              fontSize: "0.85rem",
              color: "#2563eb",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Meeting &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}