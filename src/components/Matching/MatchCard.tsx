import { useNavigate } from "react-router-dom";
import type { Match } from "../../types/match";
import VerifiedBadge from "../VerifiedBadge";
import UserRatingBadge from "./UserRatingBadge";
import "./MatchCard.css";

interface MatchCardProps {
  match: Match;
}

function MatchCard({ match }: MatchCardProps) {
  const navigate = useNavigate();

  const handleRequest = () => {
    navigate(`/matches/${match.user_id}/request`, {
      state: { match },
    });
  };

  const handleProfile = () => {
    navigate(`/users/${match.user_id}`);
  };

  const initial = match.username
    ? match.username.charAt(0).toUpperCase()
    : "?";

  return (
    <div className="match-card">
      <div className="match-header">
        <div className="match-avatar-info">
          <div
            className="avatar-placeholder"
            onClick={handleProfile}
            style={{ cursor: "pointer" }}
          >
            {initial}
          </div>

          <div>
            <h2
              className="partner-name"
              onClick={handleProfile}
              style={{ cursor: "pointer" }}
            >
              {match.username}
            </h2>

            <UserRatingBadge
              ratingAverage={match.rating_average}
              ratingCount={match.rating_count}
            />
          </div>
        </div>
      </div>

      <div className="swap-grid">
        <div className="swap-box learn-box">
          <div className="swap-box-header">
            <div>
              <span className="swap-box-title">You Learn</span>
              <span className="swap-box-subtitle">
                from {match.username}
              </span>
            </div>
          </div>

          <div className="skills-badge-list">
            {match.teach_me.map((skill) => (
              <span
                className={`skill-pill ${skill.is_matching ? "pill-matched" : "pill-default"}${skill.is_verified ? " is-verified" : ""}`}
                key={skill.name}
              >
                {skill.name}
                <VerifiedBadge
                  verified={skill.is_verified}
                  compact
                />
              </span>
            ))}
          </div>
        </div>

        <div className="swap-divider">
          <span>⇄</span>
        </div>

        <div className="swap-box teach-box">
          <div className="swap-box-header">
            <div>
              <span className="swap-box-title">You Teach</span>
              <span className="swap-box-subtitle">
                to {match.username}
              </span>
            </div>
          </div>

          <div className="skills-badge-list">
            {match.teach_them.map((skill) => (
              <span
                className={`skill-pill ${skill.is_matching ? "pill-matched" : "pill-default"}${skill.is_verified ? " is-verified" : ""}`}
                key={skill.name}
              >
                {skill.name}
                <VerifiedBadge
                  verified={skill.is_verified}
                  compact
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="match-card-footer">
        <button
          className="match-button"
          onClick={handleRequest}
        >
          Request Skill Swap &rarr;
        </button>
      </div>
    </div>
  );
}

export default MatchCard;
