import { useLocation, useNavigate } from "react-router-dom";
import type { Match, MatchSkill } from "../../types/match";
import VerifiedBadge from "../VerifiedBadge";
import "./MatchCard.css";

interface MatchCardProps {
  match: Match;
  mutual?: boolean;
}

const MAX_CHIPS = 3;

function SkillRow({
  label,
  skills,
  emptyText,
}: {
  label: string;
  skills: MatchSkill[];
  emptyText: string;
}) {
  const shown = skills.slice(0, MAX_CHIPS);
  const hidden = skills.length - shown.length;

  return (
    <div className="mc-row">
      <span className="mc-label">{label}</span>
      {skills.length === 0 ? (
        <p className="mc-empty">{emptyText}</p>
      ) : (
        <div className="mc-chips">
          {shown.map((skill) => (
            <span key={skill.name} className="mc-chip" title={skill.name}>
              <span className="mc-chip-name">{skill.name}</span>
              <VerifiedBadge verified={skill.is_verified} compact />
            </span>
          ))}
          {hidden > 0 && (
            <span
              className="mc-chip mc-chip-more"
              title={skills.slice(MAX_CHIPS).map((skill) => skill.name).join(", ")}
            >
              +{hidden}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function RatingLine({ average, count }: { average?: number; count?: number }) {
  const total = Number(count) || 0;
  if (total === 0) return <span className="mc-rating">New member</span>;

  return (
    <span className="mc-rating">
      <span className="mc-star">★</span> {(Number(average) || 0).toFixed(1)}
      <span className="mc-rating-count"> · {total} {total === 1 ? "review" : "reviews"}</span>
    </span>
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
    <article className="mc-card fx-pop">
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
          <button type="button" className="mc-name" onClick={handleProfile} title={match.username}>
            {match.username}
          </button>
          <RatingLine average={match.rating_average} count={match.rating_count} />
        </div>

        {mutual && <span className="mc-mutual">Mutual</span>}
      </header>

      <SkillRow label="Teaches" skills={match.teach_me} emptyText="No skills listed." />

      {mutual && (
        <SkillRow label="Wants to learn" skills={match.teach_them} emptyText="Nothing listed." />
      )}

      <footer className="mc-foot">
        <button type="button" className="mc-btn mc-btn-ghost" onClick={handleProfile}>
          Profile
        </button>
        <button type="button" className="mc-btn mc-btn-primary" onClick={handleRequest}>
          Request swap
        </button>
      </footer>
    </article>
  );
}

export default MatchCard;
