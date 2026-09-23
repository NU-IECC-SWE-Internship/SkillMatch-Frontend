import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getSkillQuiz,
  startSkillQuiz,
  submitSkillQuiz,
  type QuizQuestion,
  type QuizSubmitResult,
} from "../api/profileApi";
import { getErrorMessage } from "../lib/api";
import "./SkillQuiz.css";

type OptionKey = "A" | "B" | "C" | "D";

const QUESTION_SECONDS = 15;

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
  const [blockedAttempt, setBlockedAttempt] = useState<{
    score: number;
    passed: boolean;
    availableAt: string | null;
  } | null>(null);
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
                  availableAt: quiz.available_at ?? null,
                }
              : { score: 0, passed: false, availableAt: quiz.available_at ?? null },
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

        // Unanswered (timed out) count as wrong; filler choice for the API.
        const payload = questions.map((q) => ({
          question_id: q.id,
          selected: finalAnswers[q.id] ?? ("B" as OptionKey),
        }));

        const data = await submitSkillQuiz(skillId, payload);
        setResult(data);
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

  // Timer: count down 15s per question; only while the quiz has started
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
    <main className="skill-quiz-page">
      <div className="skill-quiz-shell">
        <div className="skill-quiz-topbar">
          <Link to="/profile" className="skill-quiz-back">
            &larr; Back to Profile
          </Link>
          <span className="skill-quiz-brand">SkillMatch</span>
        </div>

        <header className="skill-quiz-header">
          <h1>Verify {skillName || "skill"}</h1>
          <p>
            One question at a time. You have {QUESTION_SECONDS} seconds each.
            Pass with {passScore}/10 or higher.
          </p>
        </header>

        {loading ? (
          <p className="skill-quiz-status">Loading quiz...</p>
        ) : error && !result ? (
          <div className="skill-quiz-error-card" role="alert">
            <p>{error}</p>
            <Link to="/profile" className="skill-quiz-secondary">
              Back to Profile
            </Link>
          </div>
        ) : blockedAttempt ? (
          <section className="skill-quiz-result">
            <h2>Cooldown cooldown</h2>
            <p>
              You already took the {skillName} quiz
              {blockedAttempt.passed
                ? ` and passed with ${blockedAttempt.score}/10.`
                : ` (score ${blockedAttempt.score}/10).`}
            </p>
            <p>
              {blockedAttempt.availableAt
                ? `You can try again after ${new Date(
                    blockedAttempt.availableAt,
                  ).toLocaleString()}.`
                : "You can try again in 24 hours."}
            </p>
            <div className="skill-quiz-actions">
              <button
                type="button"
                className="skill-quiz-primary"
                onClick={() => navigate("/profile", { replace: true })}
              >
                Back to Profile
              </button>
            </div>
          </section>
        ) : result ? (
          <section className="skill-quiz-result">
            <h2>{result.passed ? "You passed!" : "Not quite yet"}</h2>
            <p>
              Score: {result.score}/{result.total}
              {result.passed
                ? " — this teach skill is now Verified."
                : ` — need at least ${result.pass_score} to verify. You can retry after 24 hours.`}
            </p>
            <div className="skill-quiz-actions">
              <button
                type="button"
                className="skill-quiz-primary"
                onClick={() => navigate("/profile", { replace: true })}
              >
                Back to Profile
              </button>
            </div>
          </section>
        ) : !started ? (
          <section className="skill-quiz-ready" role="dialog" aria-modal="true">
            <h2>Are you ready to take the quiz now?</h2>
            <p>
              When you start, we generate {questionCount} fresh questions about{" "}
              <strong>{skillName}</strong> with an AI. Each question has{" "}
              {QUESTION_SECONDS} seconds. You need {passScore}/{questionCount}{" "}
              or higher to become Verified.
            </p>
            <p className="skill-quiz-warning">
              Important: after this attempt you must wait{" "}
              <strong>24 hours</strong> before retrying.
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
                className="skill-quiz-primary"
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
          <section className="skill-quiz-card">
            <div className="skill-quiz-progress">
              <span>
                Question {index + 1} of {questions.length}
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
                className="skill-quiz-primary"
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
