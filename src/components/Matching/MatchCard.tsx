import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Match } from "../../types/match";
import VerifiedBadge from "../VerifiedBadge";
import "./MatchCard.css";

interface MatchCardProps {
  match: Match;
  mutual?: boolean;
}

// After this many tags the rest go behind "+N more".
const MAX_TAGS = 4;

function RatingText({ average, count }: { average?: number; count?: number }) {
  const total = Number(count) || 0;
  if (total === 0) return <span className="mc-rating">New member</span>;

  return (
    <span className="mc-rating">
      Rated <strong>{(Number(average) || 0).toFixed(1)}</strong> ({total}{" "}
      {total === 1 ? "review" : "reviews"})
    </span>
  );
}

// Compact tile: who they are, the skills they teach (yours highlighted first), one action.
function MatchCard({ match, mutual = false }: MatchCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAll, setShowAll] = useState(false);

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

  // In "Mutual matches" every listed skill is one you want; elsewhere is_matching marks them.
  const isWanted = (matching?: boolean) => mutual || Boolean(matching);
  const skills = [...match.teach_me].sort(
    (a, b) => Number(isWanted(b.is_matching)) - Number(isWanted(a.is_matching))
  );
  const shown = showAll ? skills : skills.slice(0, MAX_TAGS);
  const hidden = skills.length - MAX_TAGS;

  return (
    <article className="mc-card">
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
          <button type="button" className="mc-name" onClick={handleProfile} title={`View ${match.username}'s profile`}>
            {match.username}
          </button>
          <RatingText average={match.rating_average} count={match.rating_count} />
        </div>

        {mutual && <span className="mc-mutual">Mutual</span>}
      </header>

      <div className="mc-body">
        <span className="mc-label">Teaches</span>
        {skills.length === 0 ? (
          <p className="mc-empty">No skills listed.</p>
        ) : (
          <ul className="mc-tags">
            {shown.map((skill) => (
              <li
                key={skill.name}
                className={isWanted(skill.is_matching) ? "mc-tag wanted" : "mc-tag"}
                title={isWanted(skill.is_matching) ? `${skill.name} (on your learning list)` : skill.name}
              >
                {skill.name}
                <VerifiedBadge verified={skill.is_verified} compact />
              </li>
            ))}
            {hidden > 0 && (
              <li>
                <button
                  type="button"
                  className="mc-more"
                  aria-expanded={showAll}
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Show less" : `+${hidden} more`}
                </button>
              </li>
            )}
          </ul>
        )}

        {mutual && match.teach_them.length > 0 && (
          <p className="mc-wants">
            Wants to learn: {match.teach_them.map((skill) => skill.name).join(", ")}
          </p>
        )}
      </div>

      <button type="button" className="mc-request" onClick={handleRequest}>
        Request swap
      </button>
    </article>
  );
}

export default MatchCard;
