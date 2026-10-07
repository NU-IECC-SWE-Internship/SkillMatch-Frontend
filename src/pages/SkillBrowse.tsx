import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { getMatches, getTeachers } from "../api/matchingApi";
import { getMySkills } from "../api/profileApi";

import type { Teacher, SkillItem, Match, MatchSkill } from "../types/match";
import MatchCard from "../components/Matching/MatchCard";
import StatusModal from "../components/ui/StatusModal";
import { handleCursorGlow } from "../lib/cursorGlow";

import "./SkillBrowse.css";

interface MySkill {
  id: number;
  skill: number;
  skill_name: string;
  skill_type: "teach" | "learn";
  is_verified?: boolean;
}

const SKILL_PREVIEW_COUNT = 12;

function SkillBrowse() {
  const location = useLocation();

  const [learningSkills, setLearningSkills] = useState<SkillItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [myTeachSkills, setMyTeachSkills] = useState<MatchSkill[]>([]);


  const [activeFilter, setActiveFilter] = useState<
    number | "matches" | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showAllSkills, setShowAllSkills] = useState(false);

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

      const [teachersData, matchesData, userSkillsData] = await Promise.all([
        getTeachers(),
        getMatches().catch(() => [] as Match[]),
        getMySkills().catch(() => [] as MySkill[]),
      ]);

      const teachSkills: MatchSkill[] = (userSkillsData ?? [])
        .filter((s) => s.skill_type === "teach")
        .map((s) => ({
          name: s.skill_name,
          is_verified: Boolean(s.is_verified),
        }));

      setMyTeachSkills(teachSkills);
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

  function handleFilterClick(filter: number | "matches" | null) {
    setActiveFilter(filter);

    if (filter === "matches") {
      loadMatchesData();
    } else if (filter === null) {
      loadTeachers();
    } else {
      loadTeachers(filter);
    }
  }

  // Converts a teacher into the Match interface expected by MatchCard
  const teachersAsMatches: Match[] = teachers.map((teacher) => ({
    user_id: teacher.user_id,
    username: teacher.username,
    rating_average: teacher.rating_average ?? 0,
    rating_count: teacher.rating_count ?? 0,
    teach_me: teacher.skills.map((skill) => ({
      name: skill.name,
      is_verified: Boolean(skill.is_verified),
      is_matching: true,
    })),
    teach_them: myTeachSkills,
    teach_me_ids: teacher.skills.map((skill) => skill.id),
    teach_them_ids: [],
  }));

  const formattedMatches: Match[] = matches.map((m) => ({
    ...m,
    teach_me: m.teach_me.map((skill) => ({
      ...skill,
      is_matching: true,
    })),
    teach_them: m.teach_them.map((skill) => ({
      ...skill,
      is_matching: true,
    })),
  }));

  const showingMatches = activeFilter === "matches";
  const normalizedQuery = query.trim().toLowerCase();

  const visibleCards = (showingMatches ? formattedMatches : teachersAsMatches)
    .filter((match) => {
      if (!normalizedQuery) return true;

      return (
        match.username.toLowerCase().includes(normalizedQuery) ||
        match.teach_me.some((skill) =>
          skill.name.toLowerCase().includes(normalizedQuery)
        )
      );
    });

  const visibleSkills = showAllSkills
    ? learningSkills
    : learningSkills.slice(0, SKILL_PREVIEW_COUNT);

  const activeSkillName =
    typeof activeFilter === "number"
      ? learningSkills.find((skill) => skill.id === activeFilter)?.name
      : undefined;

  const listTitle = showingMatches
    ? "Mutual matches"
    : activeSkillName
      ? `People who teach ${activeSkillName}`
      : "People who can teach you";

  return (
    <>
      <StatusModal
        isOpen={Boolean(statusModal)}
        title={statusModal?.title ?? ""}
        message={statusModal?.message ?? ""}
        type={statusModal?.type ?? "success"}
        onClose={() => setStatusModal(null)}
      />

      <div className="teachers-page fx-backdrop" onPointerMove={handleCursorGlow}>
        <div className="teachers-panel">
          <nav className="teachers-nav">
            <Link to="/dashboard" className="teachers-nav-link">
              &larr; Dashboard
            </Link>

            <Link to="/profile" className="teachers-nav-link">
              My Profile &rarr;
            </Link>
          </nav>

          <header className="teachers-hero fx-hero fx-glow fx-rise">
            <h1 className="teachers-title">Find someone to learn from</h1>
            <p className="teachers-subtitle">
              Browse people who teach the skills you want, or jump straight to
              mutual matches where you can swap skills both ways.
            </p>

            <div className="teachers-search">
              <svg
                className="teachers-search-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or skill"
                aria-label="Search by name or skill"
              />
            </div>
          </header>

          <section className="teachers-filters fx-glow fx-theme-violet fx-rise fx-d1">
            <div className="teachers-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!showingMatches}
                className={!showingMatches ? "teachers-tab active" : "teachers-tab"}
                onClick={() => handleFilterClick(null)}
              >
                Everyone
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={showingMatches}
                className={showingMatches ? "teachers-tab active" : "teachers-tab"}
                onClick={() => handleFilterClick("matches")}
              >
                Mutual matches
              </button>
            </div>

            {!showingMatches && learningSkills.length > 0 && (
              <div className="skills-filter">
                <span className="skills-filter-label">
                  Skills you want to learn
                </span>

                <div className="skills-wrap">
                  <button
                    type="button"
                    className={
                      activeFilter === null ? "skill-filter active" : "skill-filter"
                    }
                    onClick={() => handleFilterClick(null)}
                  >
                    All skills
                  </button>

                  {visibleSkills.map((skill) => (
                    <button
                      type="button"
                      key={skill.id}
                      className={
                        activeFilter === skill.id
                          ? "skill-filter active"
                          : "skill-filter"
                      }
                      onClick={() => handleFilterClick(skill.id)}
                    >
                      {skill.name}
                    </button>
                  ))}

                  {learningSkills.length > SKILL_PREVIEW_COUNT && (
                    <button
                      type="button"
                      className="skill-filter more"
                      onClick={() => setShowAllSkills((current) => !current)}
                    >
                      {showAllSkills
                        ? "Show less"
                        : `+${learningSkills.length - SKILL_PREVIEW_COUNT} more`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="teachers-list-section">
            <div className="section-heading">
              <h2>{listTitle}</h2>
              {!loading && !error && (
                <span className="section-count">
                  {visibleCards.length}{" "}
                  {showingMatches
                    ? visibleCards.length === 1
                      ? "match"
                      : "matches"
                    : visibleCards.length === 1
                      ? "person"
                      : "people"}
                </span>
              )}
            </div>

            {loading && (
              <div className="matches-list">
                {[0, 1, 2, 3].map((n) => (
                  <div className="teachers-skeleton" key={n} />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="teachers-message error">{error}</div>
            )}

            {!loading && !error && visibleCards.length === 0 && (
              <div className="teachers-message">
                <h3>
                  {normalizedQuery
                    ? "No results"
                    : showingMatches
                      ? "No mutual matches yet"
                      : "Nobody teaches this yet"}
                </h3>
                <p>
                  {normalizedQuery
                    ? `Nothing matches "${query.trim()}". Try a different name or skill.`
                    : showingMatches
                      ? "Add skills you can teach and want to learn on your profile to find people to swap with."
                      : "Check back later or pick another skill."}
                </p>
              </div>
            )}

            {!loading && !error && visibleCards.length > 0 && (
              <div className="matches-list">
                {visibleCards.map((match) => (
                  <MatchCard
                    key={match.user_id}
                    match={match}
                    mutual={showingMatches}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default SkillBrowse;

