import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getMatches, getTeachers } from "../api/matchingApi";

import type { Teacher, SkillItem, Match } from "../types/match";
import MatchCard from "../components/Matching/MatchCard";
import StatusModal from "../components/ui/StatusModal";

import "./SkillBrowse.css";

function SkillBrowse() {
  const navigate = useNavigate();
  const location = useLocation();

  const [learningSkills, setLearningSkills] = useState<SkillItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [activeFilter, setActiveFilter] = useState<
    number | "matches" | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusModal, setStatusModal] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const incomingModal = (
      location.state as {
        statusModal?: {
          title: string;
          message: string;
          type?: "success" | "error";
        };
      } | null
    )?.statusModal;

    if (incomingModal) {
      setStatusModal({
        title: incomingModal.title,
        message: incomingModal.message,
        type: incomingModal.type ?? "success",
      });
    }
  }, [location.state]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [teachersData, matchesData] = await Promise.all([
        getTeachers(),
        getMatches().catch(() => [] as Match[]),
      ]);

      setLearningSkills(teachersData.learning_skills ?? []);
      setTeachers(teachersData.teachers ?? []);
      setMatches(matchesData ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load skills and teachers.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTeachers(skillId?: number) {
    try {
      setLoading(true);
      setError("");

      const data = await getTeachers(skillId);

      setTeachers(data.teachers ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load teachers.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMatchesData() {
    try {
      setLoading(true);
      setError("");

      const matchesData = await getMatches();

      setMatches(matchesData ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load matches.");
    } finally {
      setLoading(false);
    }
  }

  function handleFilterClick(
    filter: number | "matches" | null
  ) {
    setActiveFilter(filter);

    if (filter === "matches") {
      loadMatchesData();
    } else if (filter === null) {
      loadTeachers();
    } else {
      loadTeachers(filter);
    }
  }

  return (
    <>
      <StatusModal
        isOpen={Boolean(statusModal)}
        title={statusModal?.title ?? ""}
        message={statusModal?.message ?? ""}
        type={statusModal?.type ?? "success"}
        onClose={() => setStatusModal(null)}
      />

      <div className="teachers-page">
        <div className="teachers-panel">
          <div className="teachers-topbar">
            <div>
              <Link
                to="/dashboard"
                className="teachers-back-link"
              >
                ← Back to Dashboard
              </Link>

              <h1 className="teachers-title">
                Find Someone to Learn From
              </h1>

              <p className="teachers-subtitle">
                People who teach the skills you want to learn.
              </p>
            </div>

            <Link
              to="/profile"
              className="teachers-profile-link"
            >
              My Profile →
            </Link>
          </div>

          <section className="teachers-filter-section">
            <div className="section-heading">
              <h2>What do you want to learn?</h2>

              <span>
                {learningSkills.length} skills
              </span>
            </div>

            <div className="skills-scroll">
              <button
                className={
                  activeFilter === null
                    ? "skill-filter active"
                    : "skill-filter"
                }
                onClick={() => handleFilterClick(null)}
              >
                All
              </button>

              <button
                className={
                  activeFilter === "matches"
                    ? "skill-filter active"
                    : "skill-filter"
                }
                onClick={() =>
                  handleFilterClick("matches")
                }
              >
                Matches
              </button>

              {learningSkills.map((skill) => (
                <button
                  key={skill.id}
                  className={
                    activeFilter === skill.id
                      ? "skill-filter active"
                      : "skill-filter"
                  }
                  onClick={() =>
                    handleFilterClick(skill.id)
                  }
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </section>

          <section className="teachers-list-section">
            <div className="section-heading">
              <h2>
                {activeFilter === "matches"
                  ? "Mutual Matches"
                  : "People who can teach you"}
              </h2>

              <span>
                {activeFilter === "matches"
                  ? `${matches.length} matches`
                  : `${teachers.length} people`}
              </span>
            </div>

            {loading && (
              <div className="teachers-message">
                Loading...
              </div>
            )}

            {!loading && error && (
              <div className="teachers-message error">
                {error}
              </div>
            )}

            {!loading &&
              !error &&
              activeFilter === "matches" &&
              matches.length === 0 && (
                <div className="teachers-message">
                  No mutual matches found. Add skills you
                  can teach and want to learn to find a match.
                </div>
              )}

            {!loading &&
              !error &&
              activeFilter !== "matches" &&
              teachers.length === 0 && (
                <div className="teachers-message">
                  No one currently teaches this skill.
                </div>
              )}

            {!loading &&
              !error &&
              (activeFilter === "matches" ? (
                <div className="matches-list">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.user_id}
                      match={match}
                    />
                  ))}
                </div>
              ) : (
                <div className="teachers-list">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.user_id}
                      className="teacher-card"
                    >
                      <Link
                        to={`/users/${teacher.user_id}`}
                        className="teacher-avatar"
                        style={{
                          textDecoration: "none",
                        }}
                      >
                        {teacher.username
                          .charAt(0)
                          .toUpperCase()}
                      </Link>

                      <div className="teacher-info">
                        <h3>
                          <Link
                            to={`/users/${teacher.user_id}`}
                            style={{
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            {teacher.username}
                          </Link>
                        </h3>

                        <p className="teacher-label">
                          Teaches
                        </p>

                        <div className="teacher-skills">
                          {teacher.skills.map((skill) => (
                            <span
                              key={skill.id}
                              className="teacher-skill"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        className="teacher-view-btn"
                        onClick={() =>
                          navigate(
                            `/matches/${teacher.user_id}/request`,
                            {
                              state: {
                                teacher,
                              },
                            }
                          )
                        }
                      >
                        Learn from them →
                      </button>
                    </div>
                  ))}
                </div>
              ))}
          </section>
        </div>
      </div>
    </>
  );
}

export default SkillBrowse;