import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { getMatches, getTeachers } from "../api/matchingApi";
import { getMySkills } from "../api/profileApi";

import type { Teacher, SkillItem, Match, MatchSkill } from "../types/match";
import MatchCard from "../components/Matching/MatchCard";
import StatusModal from "../components/ui/StatusModal";

import "./SkillBrowse.css";

interface MySkill {
  id: number;
  skill: number;
  skill_name: string;
  skill_type: "teach" | "learn";
  is_verified?: boolean;
}

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
  const teachersAsMatches: Match[] = teachers.map((teacher: any) => ({
    user_id: teacher.user_id,
    username: teacher.username,
    rating_average: teacher.rating_average ?? 0,
    rating_count: teacher.rating_count ?? 0,
    teach_me: (teacher.skills ?? []).map((s: any) => ({
      name: typeof s === "string" ? s : s.name,
      is_verified: Boolean(s.is_verified),
    })),
    teach_them: myTeachSkills,
    teach_me_ids: (teacher.skills ?? []).map((s: any) => s.id),
    teach_them_ids: [],
  }));

  const formattedMatches: Match[] = matches.map((m: any) => ({
    ...m,
    teach_me: (m.teach_me ?? []).map((s: any) => ({
      name: typeof s === "string" ? s : s.name,
      is_verified: Boolean(s.is_verified),
    })),
    teach_them: (m.teach_them ?? []).map((s: any) => ({
      name: typeof s === "string" ? s : s.name,
      is_verified: Boolean(s.is_verified),
    })),
  }));

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

              <span>{learningSkills.length} skills</span>
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
                onClick={() => handleFilterClick("matches")}
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
                  onClick={() => handleFilterClick(skill.id)}
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
                  ? `${formattedMatches.length} matches`
                  : `${teachers.length} people`}
              </span>
            </div>

            {loading && (
              <div className="teachers-message">Loading...</div>
            )}

            {!loading && error && (
              <div className="teachers-message error">{error}</div>
            )}

            {!loading &&
              !error &&
              activeFilter === "matches" &&
              formattedMatches.length === 0 && (
                <div className="teachers-message">
                  No mutual matches found. Add skills you can teach and want to
                  learn to find a match.
                </div>
              )}

            {!loading &&
              !error &&
              activeFilter !== "matches" &&
              teachersAsMatches.length === 0 && (
                <div className="teachers-message">
                  No one currently teaches this skill.
                </div>
              )}

            {!loading && !error && (
              <div className="matches-list">
                {(activeFilter === "matches"
                  ? formattedMatches
                  : teachersAsMatches
                ).map((match) => (
                  <MatchCard key={match.user_id} match={match} />
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