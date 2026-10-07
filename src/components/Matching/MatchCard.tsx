import { useLocation, useNavigate } from "react-router-dom";
import type { Match, MatchSkill } from "../../types/match";
import VerifiedBadge from "../VerifiedBadge";
import UserRatingBadge from "./UserRatingBadge";
import "./MatchCard.css";

interface MatchCardProps {
  match: Match;
  mutual?: boolean;
}

function SkillChips({
  skills,
  tone,
  emptyText,
}: {
  skills: MatchSkill[];
  tone: "learn" | "teach";
  emptyText: string;
}) {
  if (skills.length === 0) {
    return <p className="mc-empty">{emptyText}</p>;
  }

  return (
    <div className="mc-chips">
      {skills.map((skill) => (
        <span
          key={skill.name}
          className={`mc-chip mc-chip-${tone}${skill.is_verified ? " is-verified" : ""}`}
        >
          {skill.name}
          <VerifiedBadge verified={skill.is_verified} compact />
        </span>
      ))}
    </div>
  );
}

function MatchCard({ match, mutual = false }: MatchCardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleRequest = () => {
    navigate(`/matches/${match.user_id}/request`, {
      state: { match },
    });
  };

  const handleProfile = () => {
    navigate(`/users/${match.user_id}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const initial = match.username
    ? match.username.charAt(0).toUpperCase()
    : "?";

  return (
    <article
      className={`mc-card fx-glow fx-lift fx-accent-top fx-pop ${
        mutual ? "fx-theme-teal" : "fx-theme-blue"
      }`}
    >
      <header className="mc-head">
        <button
          type="button"
          className="mc-avatar"
          onClick={handleProfile}
          aria-label={`View ${match.username}'s profile`}
        >
          {initial}
        </button>

        <div className="mc-identity">
          <button
            type="button"
            className="mc-name"
            onClick={handleProfile}
          >
            {match.username}
          </button>

          <UserRatingBadge
            ratingAverage={match.rating_average}
            ratingCount={match.rating_count}
          />
        </div>

        {mutual && <span className="mc-mutual">Mutual match</span>}
      </header>

      <div className="mc-section">
        <span className="mc-label">You learn</span>
        <SkillChips
          skills={match.teach_me}
          tone="learn"
          emptyText="No skills listed."
        />
      </div>

      <div className="mc-section">
        <span className="mc-label">
          {mutual ? "You teach" : "You can offer"}
        </span>
        <SkillChips
          skills={match.teach_them}
          tone="teach"
          emptyText="Add skills you can teach on your profile."
        />
      </div>

      <footer className="mc-foot">
        <button
          type="button"
          className="mc-btn mc-btn-ghost"
          onClick={handleProfile}
        >
          View profile
        </button>

        <button
          type="button"
          className="mc-btn mc-btn-primary"
          onClick={handleRequest}
        >
          Request swap &rarr;
        </button>
      </footer>
    </article>
  );
}

export default MatchCard;
