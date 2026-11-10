import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMySkills, type UserSkill } from "../api/profileApi";
import VerifiedBadge from "../components/VerifiedBadge";
import "./Quizzes.css";

// "in 3h 20m", "in 2d 4h" until the next attempt is allowed.
function timeUntil(iso: string | null | undefined): string {
  if (!iso) return "later";
  const minutes = Math.ceil((new Date(iso).getTime() - Date.now()) / 60000);
  if (minutes <= 0) return "now";
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h ${minutes % 60}m`;
  return `in ${Math.floor(hours / 24)}d ${hours % 24}h`;
}

// One row per skill you teach: status on the left, the right action on the right.
function QuizRow({ skill }: { skill: UserSkill }) {
  const pending = skill.skill_is_approved === false;
  const tries =
    typeof skill.quiz_attempts_left === "number"
      ? `${skill.quiz_attempts_left} ${skill.quiz_attempts_left === 1 ? "try" : "tries"} left this week`
      : null;
  const lastScore = typeof skill.quiz_score === "number" ? `Last score ${skill.quiz_score}/10` : null;

  let status: string;
  let tone: "done" | "todo" | "wait";
  if (skill.is_verified) {
    status = "Verified";
    tone = "done";
  } else if (pending) {
    status = "Waiting for admin approval";
    tone = "wait";
  } else if (skill.can_take_quiz) {
    status = skill.has_quiz_attempt ? "Not passed yet" : "Not verified";
    tone = "todo";
  } else {
    status = `Next try ${timeUntil(skill.quiz_available_at)}`;
    tone = "wait";
  }

  const details = [lastScore, !skill.is_verified && skill.can_take_quiz ? tries : null].filter(Boolean);

  return (
    <li className="qz-row">
      <div className="qz-skill">
        <span className="qz-name">
          {skill.skill_name}
          <VerifiedBadge verified={skill.is_verified} compact />
        </span>
        <span className="qz-meta">
          <span className={`qz-status ${tone}`}>{status}</span>
          {details.length > 0 && <span className="qz-details">{details.join(" · ")}</span>}
        </span>
      </div>

      <div className="qz-actions">
        {skill.has_quiz_review && (
          <Link to={`/skills/${skill.skill}/quiz/review`} className="qz-btn qz-btn-ghost">
            Review answers
          </Link>
        )}
        {!skill.is_verified && !pending && skill.can_take_quiz && (
          <Link to={`/skills/${skill.skill}/quiz`} className="qz-btn qz-btn-primary">
            {skill.has_quiz_attempt ? "Try again" : "Take quiz"}
          </Link>
        )}
      </div>
    </li>
  );
}

export default function Quizzes() {
  const [skills, setSkills] = useState<UserSkill[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMySkills()
      .then((data) => {
        if (!cancelled) setSkills(data.filter((skill) => skill.skill_type === "teach"));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your skills. Try refreshing the page.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const verified = skills?.filter((skill) => skill.is_verified).length ?? 0;

  return (
    <main className="qz-page">
      <div className="qz-container">
        <header className="qz-header">
          <h1>Quizzes</h1>
          <p>
            Pass a short quiz on a skill you teach to get a Verified badge. Verified skills
            show up as more trustworthy to people looking for a teacher.
          </p>
        </header>

        {error && <p className="qz-state qz-error">{error}</p>}

        {!error && skills === null && <p className="qz-state">Loading your skills...</p>}

        {skills && skills.length === 0 && (
          <div className="qz-state">
            <h2>No teaching skills yet</h2>
            <p>Add a skill you can teach on your profile, then come back to verify it.</p>
            <Link to="/profile" className="qz-btn qz-btn-primary">
              Go to profile
            </Link>
          </div>
        )}

        {skills && skills.length > 0 && (
          <section className="qz-card">
            <div className="qz-card-head">
              <h2>Skills you teach</h2>
              <span className="qz-count">
                {verified} of {skills.length} verified
              </span>
            </div>
            <ul className="qz-list">
              {skills.map((skill) => (
                <QuizRow key={skill.id} skill={skill} />
              ))}
            </ul>
            <p className="qz-footnote">
              Each quiz has 10 questions with 20 seconds each. To change which skills you
              teach, go to your <Link to="/profile">profile</Link>.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
