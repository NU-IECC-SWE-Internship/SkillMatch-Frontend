import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getSkillQuizReview, type SkillQuizReview as ReviewData } from "../api/profileApi";
import QuizReview from "../components/quiz/QuizReview";
import { getErrorMessage } from "../lib/api";
import { handleCursorGlow } from "../lib/cursorGlow";
import "./SkillQuiz.css";

function statusFor(data: ReviewData) {
  if (data.is_verified) {
    return {
      theme: "teal",
      icon: "🏅",
      title: "Skill verified",
      text: "This teach skill shows the Verified badge on your profile.",
    };
  }
  if (data.can_take) {
    return {
      theme: "blue",
      icon: "🔁",
      title: "Ready for another try",
      text: `You need at least ${data.pass_score} correct to verify. You can take the quiz again now.`,
    };
  }
  return {
    theme: "amber",
    icon: "⏳",
    title: "Next attempt coming up",
    text: data.available_at
      ? `You need at least ${data.pass_score} correct to verify. You can try again after ${new Date(data.available_at).toLocaleString()}.`
      : `You need at least ${data.pass_score} correct to verify.`,
  };
}

function ReviewContent({ skillId }: { skillId: number }) {
  const navigate = useNavigate();
  const [data, setData] = useState<ReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSkillQuizReview(skillId)
      .then((review) => {
        if (!cancelled) setData(review);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  if (error) {
    return (
      <div className="skill-quiz-error-card fx-rise" role="alert">
        <p>{error}</p>
        <Link to="/profile" className="skill-quiz-secondary">
          Back to Profile
        </Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="skill-quiz-header sqr-hero sqr-loading fx-hero" aria-busy="true">
        <p>Loading your answers...</p>
      </div>
    );
  }

  const takenOn = new Date(data.created_at).toLocaleString();
  const percent = data.total ? Math.round((data.score / data.total) * 100) : 0;
  const status = statusFor(data);

  return (
    <>
      <header className="skill-quiz-header sqr-hero fx-hero fx-glow fx-rise">
        <div className="sqr-hero-text">
          <span className="sqr-eyebrow">Quiz review</span>
          <h1>{data.skill_name}</h1>
          <p>Latest attempt · {takenOn}</p>
          <div className="sqr-chips">
            <span className={`sqr-chip ${data.passed ? "pass" : "fail"}`}>
              {data.passed ? "✓ Passed" : "✕ Not passed"}
            </span>
            <span className="sqr-chip">
              Pass mark {data.pass_score}/{data.total}
            </span>
          </div>
        </div>

        <div
          className="sqr-score"
          style={{ "--pct": `${percent}%` } as CSSProperties}
          role="img"
          aria-label={`${data.score} out of ${data.total} correct`}
        >
          <div className="sqr-score-inner">
            <strong>{data.score}</strong>
            <span>of {data.total}</span>
          </div>
        </div>
      </header>

      <section
        className={`skill-quiz-result sqr-status fx-glow fx-rise fx-d1 fx-theme-${status.theme}`}
      >
        <span className="fx-icon" aria-hidden="true">
          {status.icon}
        </span>
        <div className="sqr-status-body">
          <h2>{status.title}</h2>
          <p>{status.text}</p>
        </div>
        {data.can_take ? (
          <button
            type="button"
            className="skill-quiz-primary fx-btn"
            onClick={() => navigate(`/skills/${skillId}/quiz`)}
          >
            Retake quiz
          </button>
        ) : null}
      </section>

      <section className="sqr-review-card fx-rise fx-d2">
        {data.has_details ? (
          <QuizReview items={data.review} />
        ) : (
          <p className="skill-quiz-review-unavailable">
            A question-by-question review isn&apos;t available for this attempt because it was
            taken before answers were saved. Your next attempt will include a full review.
          </p>
        )}
      </section>
    </>
  );
}

export default function SkillQuizReview() {
  const skillId = Number(useParams().skillId);

  return (
    <main className="skill-quiz-page fx-backdrop" onPointerMove={handleCursorGlow}>
      <div className="skill-quiz-shell">
        <div className="skill-quiz-topbar">
          <Link to="/profile" className="skill-quiz-back">
            &larr; Back to Profile
          </Link>
          <span className="skill-quiz-brand">SkillMatch</span>
        </div>
        <ReviewContent key={skillId} skillId={skillId} />
      </div>
    </main>
  );
}
