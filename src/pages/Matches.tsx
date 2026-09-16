import MatchCard from "../components/MatchCard";
import "./Matches.css";

interface Match {
  user_id: number;
  username: string;
  can_teach_me: string[];
  i_can_teach_them: string[];
}

function Matches() {
  // Temporary data until the backend is ready
  const matches: Match[] = [
    {
      user_id: 1,
      username: "Sara",
      can_teach_me: ["React", "Figma"],
      i_can_teach_them: ["Python", "SQL"],
    },
    {
      user_id: 2,
      username: "Omar",
      can_teach_me: ["Java"],
      i_can_teach_them: ["HTML", "CSS"],
    },
  ];

  return (
    <main className="matches-page">
      <div className="matches-container">

        <div className="matches-header">
          <p className="matches-brand">SkillMatch</p>

          <h1>Find Your Matches</h1>

          <p>
            People whose skills complement what you want to learn.
          </p>
        </div>

        <div className="matches-list">
          {matches.map((match) => (
            <MatchCard
              key={match.user_id}
              match={match}
            />
          ))}
        </div>

      </div>
    </main>
  );
}

export default Matches;