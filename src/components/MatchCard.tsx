import { useNavigate } from "react-router-dom";
import type { Match } from "../types/match";

interface MatchCardProps {
  match: Match;
}

function MatchCard({ match }: MatchCardProps) {
  const navigate = useNavigate();

  return (
    <div className="match-card">
      <h2>{match.username}</h2>

      <div className="skills-section">
        <div>
          <h3>They can teach you</h3>

          <div className="skill-list">
            {match.teach_me.map((skill) => (
              <span className="skill-tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3>You can teach them</h3>

          <div className="skill-list">
            {match.teach_them.map((skill) => (
              <span className="skill-tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        className="match-button"
        onClick={() =>
          navigate(`/matches/${match.user_id}/request`)
        }
      >
        Send Request
      </button>
    </div>
  );
}

export default MatchCard;