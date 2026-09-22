import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getTeachers } from "../api/matchingApi";

import type { Teacher, SkillItem } from "../types/match";

import "./SkillBrowse.css";

function SkillBrowse() {
  const navigate = useNavigate();

  const [learningSkills, setLearningSkills] = useState<SkillItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers(skillId?: number) {
    try {
      setLoading(true);
      setError("");

      const data = await getTeachers(skillId);

      // These are ONLY the skills the current user
      // added to "Want to Learn".
      setLearningSkills(data.learning_skills);

      // These are the users who teach those skills.
      setTeachers(data.teachers);
    } catch (err) {
      console.error(err);
      setError("Could not load teachers.");
    } finally {
      setLoading(false);
    }
  }

  function handleSkillClick(skillId: number | null) {
    setSelectedSkill(skillId);

    if (skillId === null) {
      loadTeachers();
    } else {
      loadTeachers(skillId);
    }
  }

  return (
    <div className="teachers-page">
      <div className="teachers-panel">

        {/* Top bar */}

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


        {/* Skills filter */}

        <section className="teachers-filter-section">

          <div className="section-heading">
            <h2>What do you want to learn?</h2>

            <span>
              {learningSkills.length} skills
            </span>
          </div>

          <div className="skills-scroll">

            {/* All button */}

            <button
              className={
                selectedSkill === null
                  ? "skill-filter active"
                  : "skill-filter"
              }
              onClick={() => handleSkillClick(null)}
            >
              All
            </button>


            {/* ONLY the current user's learning skills */}

            {learningSkills.map((skill) => (
              <button
                key={skill.id}
                className={
                  selectedSkill === skill.id
                    ? "skill-filter active"
                    : "skill-filter"
                }
                onClick={() => handleSkillClick(skill.id)}
              >
                {skill.name}
              </button>
            ))}

          </div>

        </section>


        {/* Teachers */}

        <section className="teachers-list-section">

          <div className="section-heading">
            <h2>People who can teach you</h2>

            <span>
              {teachers.length} people
            </span>
          </div>


          {/* Loading */}

          {loading && (
            <div className="teachers-message">
              Loading teachers...
            </div>
          )}


          {/* Error */}

          {!loading && error && (
            <div className="teachers-message error">
              {error}
            </div>
          )}


          {/* No teachers */}

          {!loading && !error && teachers.length === 0 && (
            <div className="teachers-message">
              No one currently teaches this skill.
            </div>
          )}


          {/* Teacher cards */}

          {!loading && !error && teachers.length > 0 && (
            <div className="teachers-list">

              {teachers.map((teacher) => (
                <div
                  key={teacher.user_id}
                  className="teacher-card"
                >

                  {/* Avatar */}

                  <div className="teacher-avatar">
                    {teacher.username
                      .charAt(0)
                      .toUpperCase()}
                  </div>


                  {/* Teacher information */}

                  <div className="teacher-info">

                    <h3>
                      {teacher.username}
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


                  {/* Request button */}

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
          )}

        </section>

      </div>
    </div>
  );
}

export default SkillBrowse;