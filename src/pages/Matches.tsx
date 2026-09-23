import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MatchCard from "../components/Matching/MatchCard";
import { getMatches } from "../api/matchingApi";
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

  return (
    <main className="matches-page">
      <div className="matches-container">
        <div className="matches-topbar">
          <div>
            <Link to="/dashboard" className="matches-nav-link">
              &larr; Back to Dashboard
            </Link>
            <h1 className="matches-title">Find Your Matches</h1>
            <p className="matches-subtitle">
              People whose skills complement what you want to learn.
            </p>
          </div>
          <div className="matches-topbar-actions">
            <Link to="/profile" className="matches-nav-link">
              My Profile &rarr;
            </Link>
          </div>
        </div>

        <div className="matches-list">
          {error ? (
            <p>{error}</p>
          ) : loading ? null : matches.length > 0 ? (
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