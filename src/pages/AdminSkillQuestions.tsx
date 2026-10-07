import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createQuestion,
  deleteQuestion,
  generateQuestions,
  getQuestionBank,
  updateQuestion,
  type AdminQuizQuestion,
  type CorrectOption,
  type Difficulty,
  type QuestionBank,
  type QuizQuestionInput,
} from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

const OPTIONS: CorrectOption[] = ["A", "B", "C", "D"];

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const EMPTY_QUESTION: QuizQuestionInput = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  difficulty: "medium",
};

function optionKey(option: CorrectOption) {
  return `option_${option.toLowerCase()}` as `option_${"a" | "b" | "c" | "d"}`;
}

function toInput(question: AdminQuizQuestion): QuizQuestionInput {
  const { question_text, option_a, option_b, option_c, option_d, correct_option, difficulty } =
    question;
  return { question_text, option_a, option_b, option_c, option_d, correct_option, difficulty };
}

interface QuestionFormProps {
  initial: QuizQuestionInput;
  submitLabel: string;
  busy: boolean;
  onSubmit: (input: QuizQuestionInput) => void;
  onCancel: () => void;
}

function QuestionForm({ initial, submitLabel, busy, onSubmit, onCancel }: QuestionFormProps) {
  const [form, setForm] = useState<QuizQuestionInput>(initial);

  function update<K extends keyof QuizQuestionInput>(key: K, value: QuizQuestionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <label className="question-form-field">
        <span>Question</span>
        <textarea
          value={form.question_text}
          onChange={(e) => update("question_text", e.target.value)}
          rows={3}
          required
        />
      </label>

      <label className="question-form-field">
        <span>Difficulty</span>
        <select
          value={form.difficulty}
          onChange={(e) => update("difficulty", e.target.value as Difficulty)}
        >
          {DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {DIFFICULTY_LABELS[level]}
            </option>
          ))}
        </select>
      </label>

      {OPTIONS.map((option) => (
        <label key={option} className="question-form-option">
          <input
            type="radio"
            name="correct_option"
            checked={form.correct_option === option}
            onChange={() => update("correct_option", option)}
            aria-label={`Mark ${option} as correct`}
          />
          <span className="question-option-letter">{option}</span>
          <input
            type="text"
            value={form[optionKey(option)]}
            onChange={(e) => update(optionKey(option), e.target.value)}
            maxLength={255}
            required
          />
        </label>
      ))}
      <p className="question-form-hint">Select the radio button next to the correct answer.</p>

      <div className="admin-skill-actions">
        <button type="submit" className="admin-approve-btn" disabled={busy}>
          {busy ? "Saving..." : submitLabel}
        </button>
        <button type="button" className="admin-secondary-btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function QuestionsContent({ skillId }: { skillId: number }) {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Difficulty | "all">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getQuestionBank(skillId)
      .then((data) => {
        if (!cancelled) setBank(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [skillId]);

  async function run(action: () => Promise<string>) {
    try {
      setBusy(true);
      setError(null);
      setMessage(await action());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleCreate(input: QuizQuestionInput) {
    run(async () => {
      await createQuestion(skillId, input);
      setBank(await getQuestionBank(skillId));
      setAdding(false);
      return "Question added.";
    });
  }

  function handleUpdate(id: number, input: QuizQuestionInput) {
    run(async () => {
      await updateQuestion(id, input);
      setBank(await getQuestionBank(skillId));
      setEditingId(null);
      return "Question updated.";
    });
  }

  function handleDelete(question: AdminQuizQuestion) {
    if (!window.confirm("Delete this question from the bank?")) return;

    run(async () => {
      await deleteQuestion(question.id);
      setBank(await getQuestionBank(skillId));
      return "Question deleted.";
    });
  }

  function handleGenerate() {
    run(async () => {
      const result = await generateQuestions(skillId);
      const { added, ...nextBank } = result;
      setBank(nextBank);
      return added
        ? `Generated ${added} new question${added === 1 ? "" : "s"}.`
        : "No new questions added (bank full or only duplicates returned).";
    });
  }

  const bankFull = bank ? bank.current_count >= bank.bank_size : false;
  const visibleQuestions = bank
    ? bank.questions.filter((q) => filter === "all" || q.difficulty === filter)
    : [];

  return (
    <>
      <Link to="/admin/skills" className="admin-back-link">
        &larr; Back to skills
      </Link>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>{bank ? `${bank.skill_name} questions` : "Question bank"}</h2>
        </div>
        <p className="admin-empty">
          Quizzes pick random questions from this bank, mixed by difficulty and shown
          from easy to hard. New questions go into this month&apos;s bank
          {bank ? ` (${bank.current_count}/${bank.bank_size} in ${bank.cycle})` : ""}.
        </p>
      </div>

      {loading ? (
        <p className="admin-skills-status">Loading questions...</p>
      ) : (
        <div className="admin-panel">
          <div className="admin-question-toolbar">
            <button
              type="button"
              className="admin-approve-btn"
              disabled={busy || adding || bankFull}
              onClick={() => {
                setAdding(true);
                setEditingId(null);
              }}
            >
              Add question
            </button>
            <button
              type="button"
              className="admin-secondary-btn"
              disabled={busy || bankFull}
              onClick={handleGenerate}
            >
              {busy ? "Working..." : "Generate 10 with AI"}
            </button>
            {bankFull ? (
              <span className="admin-skill-meta">This month&apos;s bank is full.</span>
            ) : null}
          </div>

          {bank ? (
            <div className="admin-difficulty-bar" role="group" aria-label="Filter by difficulty">
              <button
                type="button"
                className={filter === "all" ? "admin-difficulty-chip active" : "admin-difficulty-chip"}
                onClick={() => setFilter("all")}
              >
                All ({bank.questions.length})
              </button>
              {DIFFICULTIES.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={
                    filter === level
                      ? `admin-difficulty-chip ${level} active`
                      : `admin-difficulty-chip ${level}`
                  }
                  onClick={() => setFilter(level)}
                  title={`This month: ${bank.difficulty_counts[level]} of ${bank.difficulty_targets[level]} target`}
                >
                  {DIFFICULTY_LABELS[level]} {bank.difficulty_counts[level]}/
                  {bank.difficulty_targets[level]}
                </button>
              ))}
            </div>
          ) : null}

          {message ? <p className="admin-skills-message">{message}</p> : null}
          {error ? (
            <p className="admin-skills-error" role="alert">
              {error}
            </p>
          ) : null}

          {adding ? (
            <QuestionForm
              initial={EMPTY_QUESTION}
              submitLabel="Add question"
              busy={busy}
              onSubmit={handleCreate}
              onCancel={() => setAdding(false)}
            />
          ) : null}

          {!bank || visibleQuestions.length === 0 ? (
            <p className="admin-skills-status">
              {bank && bank.questions.length > 0
                ? "No questions at this difficulty yet."
                : "No questions yet. Add one or generate a batch with AI."}
            </p>
          ) : (
            <ol className="admin-question-list">
              {visibleQuestions.map((question) => (
                <li key={question.id} className="admin-question-card">
                  {editingId === question.id ? (
                    <QuestionForm
                      initial={toInput(question)}
                      submitLabel="Save changes"
                      busy={busy}
                      onSubmit={(input) => handleUpdate(question.id, input)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="admin-question-header">
                        <p className="admin-question-text">{question.question_text}</p>
                        <span className={`admin-difficulty-badge ${question.difficulty}`}>
                          {DIFFICULTY_LABELS[question.difficulty]}
                        </span>
                        {question.cycle !== bank.cycle ? (
                          <span className="admin-question-cycle">{question.cycle}</span>
                        ) : null}
                      </div>

                      <ul className="admin-question-options">
                        {OPTIONS.map((option) => (
                          <li
                            key={option}
                            className={
                              option === question.correct_option
                                ? "admin-question-option correct"
                                : "admin-question-option"
                            }
                          >
                            <span className="question-option-letter">{option}</span>
                            {question[optionKey(option)]}
                          </li>
                        ))}
                      </ul>

                      <div className="admin-skill-actions">
                        <button
                          type="button"
                          className="admin-secondary-btn"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(question.id);
                            setAdding(false);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-deny-btn"
                          disabled={busy}
                          onClick={() => handleDelete(question)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </>
  );
}

export default function AdminSkillQuestions() {
  const skillId = Number(useParams().skillId);
  return (
    <AdminLayout title="Question bank" subtitle="View, add, edit and generate quiz questions.">
      <QuestionsContent key={skillId} skillId={skillId} />
    </AdminLayout>
  );
}
