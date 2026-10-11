import { Link } from "react-router-dom";
import type { MatchRequest } from "../../api/matchingApi";
import VerifiedBadge from "../VerifiedBadge";
import { PersonHeader, StatusChip } from "./RequestsLayout";

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

  const userId = sentByMe
    ? request.receiver
    : request.sender;

  const ratingAvg = sentByMe
    ? request.receiver_rating_average
    : request.sender_rating_average;

  const ratingCount = sentByMe
    ? request.receiver_rating_count
    : request.sender_rating_count;

  const selectedSkillName =
    request.receiver_skill_name === null ||
    request.receiver_skill_name === undefined
      ? "None"
      : request.receiver_skill_name || request.skill_name;

  const accepted = request.status === "ACCEPTED";

  return (
    <div
      className={`incoming-card past-card fx-glow fx-lift fx-pop ${
        accepted ? "fx-theme-teal" : "fx-theme-rose"
      }`}
    >
      <PersonHeader
        userId={userId}
        username={username}
        ratingAverage={ratingAvg}
        ratingCount={ratingCount}
        muted
        subtitle={
          <span
            className={
              request.skill_is_verified
                ? "skill-pill pill-learn is-verified"
                : "skill-pill pill-learn"
            }
          >
            {request.skill_name || `Skill #${request.skill}`}
            <VerifiedBadge verified={!!request.skill_is_verified} compact />
          </span>
        }
        status={
          accepted ? (
            <StatusChip tone="success">Accepted</StatusChip>
          ) : (
            <StatusChip tone="danger">Declined</StatusChip>
          )
        }
      />

      {(accepted || request.rejection_reason) && (
        <div className="past-card-footer">
          {accepted ? (
            <>
              <span className="past-card-note">
                Return skill: <strong>{selectedSkillName}</strong>
              </span>

              <Link to="/meetings" className="view-meeting-link">
                View meeting &rarr;
              </Link>
            </>
          ) : (
            <span className="past-card-note">
              Reason: <em>{request.rejection_reason}</em>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
