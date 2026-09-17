import { useEffect, useState } from "react";
import MatchCard from "../components/MatchCard";
import { getMatches } from "../lib/matchingApi";
import type { Match } from "../types/match";
import "./Matches.css";

function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await getMatches();
        setMatches(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load matches"
        );
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  if (loading) {
    return <p>Loading matches...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

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
          {matches.length > 0 ? (
            matches.map((match) => (
              <MatchCard
                key={match.user_id}
                match={match}
              />
            ))
          ) : (
            <p>No matches found yet. Add skills you can teach and want to learn to find a match.</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default Matches;