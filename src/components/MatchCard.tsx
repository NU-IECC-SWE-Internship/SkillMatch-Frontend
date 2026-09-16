import { useNavigate } from "react-router-dom";

interface Match {
  user_id: number;
  username: string;
  can_teach_me: string[];
  i_can_teach_them: string[];
}

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
            {match.can_teach_me.map((skill) => (
              <span className="skill-tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3>You can teach them</h3>

          <div className="skill-list">
            {match.i_can_teach_them.map((skill) => (
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
