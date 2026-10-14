import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getSkillQuiz,
  startSkillQuiz,
  submitSkillQuiz,
  type QuizQuestion,
  type QuizReviewItem,
  type QuizSubmitResult,
} from "../api/profileApi";
import QuizReview from "../components/quiz/QuizReview";
import { getErrorMessage } from "../lib/api";
import { handleCursorGlow } from "../lib/cursorGlow";
import "./SkillQuiz.css";

type OptionKey = "A" | "B" | "C" | "D";

const QUESTION_SECONDS = 20;

function windowLabel(hours: number) {
  if (hours % 24 !== 0) return `in the last ${hours} hours`;
  const days = hours / 24;
  return days === 7 ? "this week" : `in the last ${days} days`;
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function optionText(q: QuizQuestion, key: OptionKey) {
  if (key === "A") return q.option_a;
  if (key === "B") return q.option_b;
  if (key === "C") return q.option_c;
  return q.option_d;
}

export default function SkillQuiz() {
  const { skillId: skillIdParam } = useParams();
  const skillId = Number(skillIdParam);
  const navigate = useNavigate();

  const [skillName, setSkillName] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [passScore, setPassScore] = useState(7);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, OptionKey>>({});
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [started, setStarted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [limits, setLimits] = useState({ max: 5, left: 5, windowHours: 168 });
  const [blockedAttempt, setBlockedAttempt] = useState<{
    score: number;
    passed: boolean;
    abandoned: boolean;
    availableAt: string | null;
    review: QuizReviewItem[];
  } | null>(null);
  const [showLastReview, setShowLastReview] = useState(false);
  const advancingRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const current = questions[index] ?? null;
  const isLast = index === questions.length - 1;

  useEffect(() => {
    if (!Number.isFinite(skillId) || skillId <= 0) {
      setError("Invalid skill.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const quiz = await getSkillQuiz(skillId);
        if (cancelled) return;
        setSkillName(quiz.skill_name);
        setPassScore(quiz.pass_score);
        setQuestionCount(quiz.question_count ?? 10);
        setLimits({
          max: quiz.max_attempts,
          left: quiz.attempts_left,
          windowHours: quiz.attempt_window_hours,
        });
        setIndex(0);
        setAnswers({});
        setSecondsLeft(QUESTION_SECONDS);
        setResult(null);
        setStarted(false);
        setQuestions([]);
        advancingRef.current = false;

        if (!quiz.can_take) {
          setBlockedAttempt(
            quiz.attempt
              ? {
                  score: quiz.attempt.score,
                  passed: quiz.attempt.passed,
                  abandoned: Boolean(quiz.attempt.abandoned),
                  availableAt: quiz.available_at ?? null,
                  review: quiz.attempt.review ?? [],
                }
              : {
                  score: 0,
                  passed: false,
                  abandoned: false,
                  availableAt: quiz.available_at ?? null,
                  review: [],
                },
          );
        } else {
          setBlockedAttempt(null);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  const finishQuiz = useCallback(
    async (finalAnswers: Record<number, OptionKey>) => {
      if (!questions.length) return;

      try {
        setSubmitting(true);
        setError(null);

        // Unanswered (timed out) questions are sent as null and count as wrong.
        const payload = questions.map((q) => ({
          question_id: q.id,
          selected: finalAnswers[q.id] ?? null,
        }));

        const data = await submitSkillQuiz(skillId, payload);
        setResult(data);
        setLimits({
          max: data.max_attempts,
          left: data.attempts_left,
          windowHours: data.attempt_window_hours,
        });
      } catch (err) {
        setError(getErrorMessage(err));
        advancingRef.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [questions, skillId],
  );

  const goNext = useCallback(() => {
    if (advancingRef.current || submitting || result) return;
    advancingRef.current = true;

    if (isLast) {
      void finishQuiz(answersRef.current);
      return;
    }

    setIndex((i) => i + 1);
    setSecondsLeft(QUESTION_SECONDS);
    window.setTimeout(() => {
      advancingRef.current = false;
    }, 0);
  }, [finishQuiz, isLast, result, submitting]);

  // Timer: count down 20s per question; only while the quiz has started
  useEffect(() => {
    if (!started || loading || error || result || submitting || !current) return;

    if (secondsLeft <= 0) {
      goNext();
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    started,
    secondsLeft,
    loading,
    error,
    result,
    submitting,
    current,
    goNext,
  ]);

  // Leaving mid-quiz counts as a failed attempt, so warn before unload.
  useEffect(() => {
    if (!started || result) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [started, result]);

  function tryAgain() {
    setResult(null);
    setStarted(false);
    setQuestions([]);
    setError(null);
  }

  const periodText = windowLabel(limits.windowHours);

  async function startQuiz() {
    try {
      setGenerating(true);
      setError(null);
      const quiz = await startSkillQuiz(skillId);
      setQuestions(quiz.questions);
      setPassScore(quiz.pass_score);
      setIndex(0);
      setAnswers({});
      setSecondsLeft(QUESTION_SECONDS);
      advancingRef.current = false;
      setStarted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="skill-quiz-page fx-backdrop" onPointerMove={handleCursorGlow}>
      <div className="skill-quiz-shell">
        <header className="skill-quiz-header fx-hero fx-glow fx-rise">
          <h1>Verify {skillName || "skill"}</h1>
          <p>
            One question at a time. You have {QUESTION_SECONDS} seconds each.
            Pass with {passScore}/{questionCount} or higher.
          </p>
        </header>

        {loading ? (
          <p className="skill-quiz-status">Loading quiz...</p>
        ) : error && !result ? (
          <div className="skill-quiz-error-card fx-glow fx-accent-top fx-theme-rose fx-rise fx-d1" role="alert">
            <p>{error}</p>
            <Link to="/profile" className="skill-quiz-secondary">
              Back to Profile
            </Link>
          </div>
        ) : blockedAttempt ? (
          <section className="skill-quiz-result fx-glow fx-accent-top fx-theme-amber fx-rise fx-d1">
            <h2>{blockedAttempt.passed ? "Already verified" : "No attempts left"}</h2>
            {blockedAttempt.passed ? (
              <p>
                You passed the {skillName} quiz with {blockedAttempt.score}/{questionCount}.
              </p>
            ) : (
              <>
                <p>
                  You've used all {plural(limits.max, "attempt")} for the {skillName} quiz{" "}
                  {periodText}.{" "}
                  {blockedAttempt.abandoned
                    ? "Your last quiz was left before it was submitted, so it counted as a failed attempt."
                    : `Your last score was ${blockedAttempt.score}/${questionCount}.`}
                </p>
                <p>
                  {blockedAttempt.availableAt
                    ? `Your next attempt opens on ${new Date(
                        blockedAttempt.availableAt,
                      ).toLocaleString()}.`
                    : "Your next attempt opens once an earlier one is more than a week old."}
                </p>
              </>
            )}
            <div className="skill-quiz-actions">
              {blockedAttempt.review.length > 0 ? (
                <button
                  type="button"
                  className="skill-quiz-secondary"
                  onClick={() => setShowLastReview((shown) => !shown)}
                  aria-expanded={showLastReview}
                >
                  {showLastReview ? "Hide answers" : "Review your answers"}
                </button>
              ) : null}
              <button
                type="button"
                className="skill-quiz-primary fx-btn"
                onClick={() => navigate("/profile", { replace: true })}
              >
                Back to Profile
              </button>
            </div>
            {showLastReview ? <QuizReview items={blockedAttempt.review} /> : null}
          </section>
        ) : result ? (
          <section
            className={`skill-quiz-result fx-glow fx-accent-top fx-pop ${
              result.passed ? "fx-theme-teal" : "fx-theme-rose"
            }`}
          >
            <h2>{result.passed ? "You passed!" : "Not quite yet"}</h2>
            <p>
              Score: {result.score}/{result.total}
              {result.passed
                ? " — this teach skill is now Verified."
                : ` — need at least ${result.pass_score} to verify.`}
            </p>
            {!result.passed ? (
              <p>
                {result.attempts_left > 0
                  ? `You have ${plural(result.attempts_left, "attempt")} left ${periodText}.`
                  : `That was your last attempt ${periodText}.${
                      result.available_at
                        ? ` Your next attempt opens on ${new Date(result.available_at).toLocaleString()}.`
                        : ""
                    }`}
              </p>
            ) : null}
            <div className="skill-quiz-actions">
              {result.can_retry ? (
                <button type="button" className="skill-quiz-secondary" onClick={tryAgain}>
                  Try again
                </button>
              ) : null}
              <button
                type="button"
                className="skill-quiz-primary fx-btn"
                onClick={() => navigate("/profile", { replace: true })}
              >
                Back to Profile
              </button>
            </div>
            {result.review?.length ? <QuizReview items={result.review} /> : null}
          </section>
        ) : !started ? (
          <section className="skill-quiz-ready fx-glow fx-accent-top fx-theme-violet fx-rise fx-d1" role="dialog" aria-modal="true">
            <h2>Are you ready to take the quiz now?</h2>
            <p>
              When you start, we generate {questionCount} fresh questions about{" "}
              <strong>{skillName}</strong> . Each question has{" "}
              {QUESTION_SECONDS} seconds. You need {passScore}/{questionCount}{" "}
              or higher to become Verified.
            </p>
            <p className="skill-quiz-warning">
              Important: you have{" "}
              <strong>
                {limits.left} of {plural(limits.max, "attempt")}
              </strong>{" "}
              left {periodText}, and starting the quiz uses one. Leaving or
              refreshing the page before you finish counts as a failed attempt.
            </p>
            {error ? (
              <p className="skill-quiz-inline-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="skill-quiz-actions">
              <button
                type="button"
                className="skill-quiz-secondary"
                onClick={() => navigate("/profile", { replace: true })}
                disabled={generating}
              >
                Not now
              </button>
              <button
                type="button"
                className="skill-quiz-primary fx-btn"
                onClick={startQuiz}
                disabled={generating}
              >
                {generating
                  ? "Generating questions..."
                  : "Yes, start quiz"}
              </button>
            </div>
          </section>
        ) : current ? (
          <section key={current.id} className="skill-quiz-card fx-glow fx-accent-top fx-theme-violet fx-pop">
            <div className="skill-quiz-progress">
              <span>
                Question {index + 1} of {questions.length}
                <span className={`skill-quiz-difficulty ${current.difficulty}`}>
                  {current.difficulty}
                </span>
              </span>
              <span
                className={
                  secondsLeft <= 5
                    ? "skill-quiz-timer urgent"
                    : "skill-quiz-timer"
                }
              >
                {Math.max(secondsLeft, 0)}s
              </span>
            </div>

            <div className="skill-quiz-timer-bar" aria-hidden="true">
              <span
                style={{
                  width: `${(Math.max(secondsLeft, 0) / QUESTION_SECONDS) * 100}%`,
                }}
              />
            </div>

            <h2 className="skill-quiz-question">{current.question_text}</h2>

            <div className="skill-quiz-options">
              {(["A", "B", "C", "D"] as OptionKey[]).map((key) => (
                <label
                  key={key}
                  className={
                    answers[current.id] === key
                      ? "skill-quiz-option selected"
                      : "skill-quiz-option"
                  }
                >
                  <input
                    type="radio"
                    name={`q-${current.id}`}
                    value={key}
                    checked={answers[current.id] === key}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [current.id]: key }))
                    }
                    disabled={submitting}
                  />
                  <span>
                    <strong>{key}.</strong> {optionText(current, key)}
                  </span>
                </label>
              ))}
            </div>

            {error ? (
              <p className="skill-quiz-inline-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="skill-quiz-actions">
              <button
                type="button"
                className="skill-quiz-primary fx-btn"
                onClick={goNext}
                disabled={submitting || !answers[current.id]}
              >
                {submitting
                  ? "Submitting..."
                  : isLast
                    ? "Finish"
                    : "Next"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
