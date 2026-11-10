import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { getMatches, getTeachers } from "../api/matchingApi";
import { getMySkills } from "../api/profileApi";

import type { Teacher, SkillItem, Match, MatchSkill, CatalogSkill } from "../types/match";
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

// null = people teaching what you want, "all" = everyone, number = one skill
type BrowseFilter = number | "all" | "matches" | null;

function SkillBrowse() {
  const location = useLocation();

  const [learningSkills, setLearningSkills] = useState<SkillItem[]>([]);
  const [allSkills, setAllSkills] = useState<CatalogSkill[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [myTeachSkills, setMyTeachSkills] = useState<MatchSkill[]>([]);


  const [activeFilter, setActiveFilter] = useState<BrowseFilter>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  // "Browse all skills" panel
  const [catalogOpen, setCatalogOpen] = useState(false);

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
      setAllSkills(teachersData.all_skills ?? []);
      setTeachers(teachersData.teachers ?? []);
      setMatches(matchesData ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load skills and teachers.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTeachers(skill?: number | "all") {
    try {
      setLoading(true);
      setError("");

      const data = await getTeachers(skill);
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

  function handleFilterClick(filter: BrowseFilter) {
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
    // Every skill they teach; the ones you want to learn are highlighted.
    teach_me: teacher.skills.map((skill) => ({
      name: skill.name,
      is_verified: Boolean(skill.is_verified),
      is_matching: Boolean(skill.wanted),
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

  // The search box also narrows the "all skills" list and opens it.
  const catalogSkills = normalizedQuery
    ? allSkills.filter((skill) => skill.name.toLowerCase().includes(normalizedQuery))
    : allSkills;
  const catalogVisible = catalogOpen || (normalizedQuery !== "" && catalogSkills.length > 0);

  const activeSkillName =
    typeof activeFilter === "number"
      ? (allSkills.find((skill) => skill.id === activeFilter) ??
          learningSkills.find((skill) => skill.id === activeFilter))?.name
      : undefined;

  const listTitle = showingMatches
    ? "Mutual matches"
    : activeFilter === "all"
      ? "Everyone, all skills"
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
          <header className="teachers-hero fx-rise">
            <div className="teachers-hero-copy">
              <span className="teachers-eyebrow">Peer exchange catalog</span>
              <h1 className="teachers-title">Find someone to learn from</h1>
              <p className="teachers-subtitle">
                Browse people who teach the skills you want, or jump straight to
                mutual matches where you can swap skills both ways.
              </p>
            </div>

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

          <section className="teachers-filters fx-rise fx-d1">
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

            {/* With one learning skill, "For you" and that skill show the same people,
                so the row only appears when it can narrow things down or to get back to "For you". */}
            {!showingMatches && (learningSkills.length > 1 || activeFilter !== null) && (
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
                    For you
                  </button>

                  {learningSkills.length > 1 && learningSkills.map((skill) => (
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
                </div>
              </div>
            )}
          </section>

          {!showingMatches && allSkills.length > 0 && (
            <section className="skills-catalog fx-rise fx-d1">
              <button
                type="button"
                className="skills-catalog-toggle"
                aria-expanded={catalogVisible}
                aria-controls="skills-catalog-list"
                onClick={() => setCatalogOpen(!catalogVisible)}
              >
                <span>
                  {normalizedQuery
                    ? `Skills matching "${query.trim()}" (${catalogSkills.length})`
                    : `Not finding what you need? Browse all ${allSkills.length} skills`}
                </span>
                <span className="skills-catalog-action">
                  {catalogVisible ? "Hide skills" : "Show skills"}
                </span>
              </button>

              {catalogVisible && (
                <div className="skills-wrap skills-catalog-list" id="skills-catalog-list">
                  <button
                    type="button"
                    className={activeFilter === "all" ? "skill-filter active" : "skill-filter"}
                    onClick={() => handleFilterClick("all")}
                  >
                    All skills
                  </button>

                  {catalogSkills.map((skill) => (
                    <button
                      type="button"
                      key={skill.id}
                      className={[
                        "skill-filter",
                        activeFilter === skill.id ? "active" : "",
                        skill.wanted ? "wanted" : "",
                        // Nobody teaches it yet: shown lighter
                        skill.teacher_count === 0 ? "empty" : "",
                      ].join(" ").trim()}
                      title={
                        skill.teacher_count === 0
                          ? `Nobody teaches ${skill.name} yet`
                          : `${skill.teacher_count} ${skill.teacher_count === 1 ? "person teaches" : "people teach"} ${skill.name}`
                      }
                      onClick={() => handleFilterClick(skill.id)}
                    >
                      {skill.name}
                      <span className="skill-filter-count">{skill.teacher_count}</span>
                    </button>
                  ))}

                  {catalogSkills.length === 0 && (
                    <span className="skills-catalog-empty">No skill matches "{query.trim()}".</span>
                  )}
                </div>
              )}
            </section>
          )}

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
                      : activeSkillName
                        ? `No one has added ${activeSkillName} as a skill they teach. Try another skill above.`
                        : "Open \"Browse all skills\" above to see every skill."}
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

