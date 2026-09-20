import { Link } from "react-router-dom";
import type { MatchRequest } from "../../api/matchingApi";

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

  const initial = username
    ? username.charAt(0).toUpperCase()
    : "?";

  return (
    <div className="incoming-card past-card">
      <div className="incoming-card-top">
        <div className="sender-avatar muted">
          {initial}
        </div>

        <div>
          <h3 className="sender-name">
            {sentByMe ? `Request to ${username}` : username}
          </h3>

          <span className="skill-pill pill-learn">
            {request.skill_name || `Skill #${request.skill}`}
          </span>
        </div>
      </div>

      <div className="status-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          className={`status-tag status-${request.status.toLowerCase()}`}
        >
          {request.status}
        </span>
        {request.status === "ACCEPTED" && (
          <Link to="/meetings" className="view-meeting-link" style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            View Meeting &rarr;
          </Link>
        )}
      </div>

      {request.status === "REJECTED" &&
        request.rejection_reason && (
          <div className="rejection-reason">
            <span className="detail-label">
              Reason for rejection
            </span>

            <p>{request.rejection_reason}</p>
          </div>
        )}
    </div>
  );
}