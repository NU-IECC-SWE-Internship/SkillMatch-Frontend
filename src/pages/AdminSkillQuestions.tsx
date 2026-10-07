import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
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
import { SearchIcon } from "../components/admin/AdminIcons";
import { useConfirm } from "../components/admin/useConfirm";
import { useFlash } from "../components/admin/useFlash";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

const OPTIONS: CorrectOption[] = ["A", "B", "C", "D"];

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#16a34a",
  medium: "#d97706",
  hard: "#dc2626",
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

function ProgressBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="admin-progress" style={{ "--accent": color } as CSSProperties}>
      <div className="admin-progress-label">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div
        className="admin-progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div className="admin-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
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

function BankSummary({ bank }: { bank: QuestionBank }) {
  const full = bank.current_count >= bank.bank_size;
  return (
    <section className="admin-panel admin-bank-summary">
      <div className="admin-bank-total">
        <ProgressBar
          label={`This month's bank (${bank.cycle})`}
          value={bank.current_count}
          max={bank.bank_size}
          color={full ? "#16a34a" : "#2563eb"}
        />
        <p className="admin-bank-hint">
          {full
            ? "The bank is full. Quizzes now draw only from this month's questions."
            : "Until this month's bank is full, quizzes also draw from last month's questions."}
        </p>
      </div>

      <div className="admin-bank-levels">
        <h3 className="admin-subheading">By difficulty (this month vs target)</h3>
        {DIFFICULTIES.map((level) => (
          <ProgressBar
            key={level}
            label={DIFFICULTY_LABELS[level]}
            value={bank.difficulty_counts[level]}
            max={bank.difficulty_targets[level]}
            color={DIFFICULTY_COLORS[level]}
          />
        ))}
        <p className="admin-bank-hint">
          AI generation fills whichever levels are furthest below their target. Each quiz is
          ordered from easy to hard.
        </p>
      </div>
    </section>
  );
}

function QuestionsContent({ skillId }: { skillId: number }) {
  const { confirm, dialog } = useConfirm();
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Difficulty | "all">("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useFlash();

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

  async function handleDelete(question: AdminQuizQuestion) {
    const confirmed = await confirm({
      title: "Delete this question?",
      message: (
        <>
          <p>&ldquo;{question.question_text}&rdquo;</p>
          <p>It will be removed from the bank and won&apos;t appear in future quizzes.</p>
        </>
      ),
      confirmLabel: "Delete question",
      danger: true,
    });
    if (!confirmed) return;

    run(async () => {
      await deleteQuestion(question.id);
      setBank(await getQuestionBank(skillId));
      return "Question deleted.";
    });
  }

  function handleGenerate() {
    setGenerating(true);
    run(async () => {
      try {
        const result = await generateQuestions(skillId);
        const { added, ...nextBank } = result;
        setBank(nextBank);
        return added
          ? `Generated ${added} new question${added === 1 ? "" : "s"}.`
          : "No new questions added (bank full or only duplicates returned).";
      } finally {
        setGenerating(false);
      }
    });
  }

  const bankFull = bank ? bank.current_count >= bank.bank_size : false;
  const query = search.trim().toLowerCase();
  const visibleQuestions = bank
    ? bank.questions.filter(
        (q) =>
          (filter === "all" || q.difficulty === filter) &&
          (!query ||
            [q.question_text, q.option_a, q.option_b, q.option_c, q.option_d].some((text) =>
              text.toLowerCase().includes(query),
            )),
      )
    : [];
  const levelCount = (level: Difficulty) =>
    bank ? bank.questions.filter((q) => q.difficulty === level).length : 0;

  return (
    <AdminLayout
      title={bank ? `${bank.skill_name} questions` : "Question bank"}
      subtitle="Questions used to verify that a user can teach this skill."
    >
      {dialog}

      <Link to="/admin/skills" className="admin-back-link">
        &larr; Back to skills
      </Link>

      {error ? (
        <p className="admin-skills-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="admin-skills-status">Loading questions...</p>
      ) : !bank ? null : (
        <>
          <BankSummary bank={bank} />

          <section className="admin-panel">
            <div className="admin-panel-header">
              <h2>Questions</h2>
              <div className="admin-skill-actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  disabled={busy || bankFull}
                  onClick={handleGenerate}
                  title={bankFull ? "This month's bank is full." : "Ask the AI for a new batch of questions."}
                >
                  {generating ? "Generating..." : "Generate with AI"}
                </button>
                <button
                  type="button"
                  className="admin-approve-btn"
                  disabled={busy || adding || bankFull}
                  onClick={() => {
                    setAdding(true);
                    setEditingId(null);
                  }}
                  title={bankFull ? "This month's bank is full." : undefined}
                >
                  + Add question
                </button>
              </div>
            </div>

            <div className="admin-toolbar">
              <div className="admin-search-field">
                <SearchIcon />
                <input
                  type="search"
                  className="admin-search"
                  placeholder="Search questions and answers"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
                  >
                    {DIFFICULTY_LABELS[level]} ({levelCount(level)})
                  </button>
                ))}
              </div>
            </div>

            {message ? <p className="admin-skills-message">{message}</p> : null}

            {adding ? (
              <QuestionForm
                initial={EMPTY_QUESTION}
                submitLabel="Add question"
                busy={busy}
                onSubmit={handleCreate}
                onCancel={() => setAdding(false)}
              />
            ) : null}

            {visibleQuestions.length === 0 ? (
              <div className="admin-empty-state">
                {bank.questions.length === 0 ? (
                  <>
                    <strong>No questions yet</strong>
                    <p>Add one yourself or generate a batch with AI.</p>
                  </>
                ) : (
                  <p>No questions match these filters.</p>
                )}
              </div>
            ) : (
              <>
                <p className="admin-result-count">
                  Showing {visibleQuestions.length} of {bank.questions.length} questions
                </p>
                <ol className="admin-question-list">
                  {visibleQuestions.map((question, index) => (
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
                            <span className="admin-question-number">{index + 1}</span>
                            <p className="admin-question-text">{question.question_text}</p>
                            <div className="admin-question-tags">
                              <span className={`admin-difficulty-badge ${question.difficulty}`}>
                                {DIFFICULTY_LABELS[question.difficulty]}
                              </span>
                              {question.cycle !== bank.cycle ? (
                                <span
                                  className="admin-question-cycle"
                                  title={`From the ${question.cycle} bank. It will be removed once this month's bank is full.`}
                                >
                                  Last month
                                </span>
                              ) : null}
                            </div>
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
                                <span className="admin-question-option-text">
                                  {question[optionKey(option)]}
                                </span>
                                {option === question.correct_option ? (
                                  <span className="admin-correct-tag">Correct</span>
                                ) : null}
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
              </>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export default function AdminSkillQuestions() {
  const skillId = Number(useParams().skillId);
  return <QuestionsContent key={skillId} skillId={skillId} />;
}
