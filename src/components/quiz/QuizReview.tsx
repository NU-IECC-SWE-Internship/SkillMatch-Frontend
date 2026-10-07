import { useState } from "react";
import type { QuizOption, QuizReviewItem } from "../../api/profileApi";
import "./QuizReview.css";

const OPTIONS: QuizOption[] = ["A", "B", "C", "D"];

type Filter = "all" | "wrong" | "correct";

function optionText(item: QuizReviewItem, option: QuizOption) {
  return item[`option_${option.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"];
}

function optionState(item: QuizReviewItem, option: QuizOption) {
  const isSelected = item.selected === option;
  const isCorrect = item.correct_option === option;
  if (isSelected && isCorrect) return { className: "correct", label: "Your answer · Correct" };
  if (isSelected) return { className: "wrong", label: "Your answer" };
  if (isCorrect) return { className: "answer", label: "Correct answer" };
  return { className: "", label: "" };
}

export default function QuizReview({ items }: { items: QuizReviewItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const correctCount = items.filter((item) => item.is_correct).length;
  const wrongCount = items.length - correctCount;
  const answersHidden = items.some((item) => !item.is_correct && item.correct_option === null);
  const visible = items.filter((item) =>
    filter === "all" ? true : filter === "correct" ? item.is_correct : !item.is_correct,
  );

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: `All (${items.length})` },
    { value: "wrong", label: `Wrong (${wrongCount})` },
    { value: "correct", label: `Correct (${correctCount})` },
  ];

  return (
    <section className="quiz-review" aria-label="Answer review">
      <div className="quiz-review-header">
        <h3>Review your answers</h3>
        <div className="quiz-review-filters" role="group" aria-label="Filter questions">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? "active" : undefined}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {answersHidden ? (
        <p className="quiz-review-note">
          Correct answers to missed questions are hidden so the quiz stays fair for your next
          attempt.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="quiz-review-empty">
          {filter === "wrong" ? "No wrong answers. Nice work!" : "No correct answers this time."}
        </p>
      ) : (
        <ol className="quiz-review-list">
          {visible.map((item) => (
            <li
              key={item.order}
              className={item.is_correct ? "quiz-review-item is-correct" : "quiz-review-item is-wrong"}
            >
              <div className="quiz-review-question">
                <span className="quiz-review-mark" aria-hidden="true">
                  {item.is_correct ? "✓" : "✕"}
                </span>
                <div>
                  <span className="quiz-review-meta">
                    Question {item.order}
                    {item.difficulty ? ` · ${item.difficulty}` : ""}
                    <span className="sr-only">{item.is_correct ? ", correct" : ", wrong"}</span>
                  </span>
                  <p>{item.question_text}</p>
                </div>
              </div>

              {item.selected === null ? (
                <p className="quiz-review-timeout">Time ran out before you picked an answer.</p>
              ) : null}

              <ul className="quiz-review-options">
                {OPTIONS.map((option) => {
                  const state = optionState(item, option);
                  return (
                    <li key={option} className={`quiz-review-option ${state.className}`}>
                      <span className="quiz-review-letter">{option}</span>
                      <span className="quiz-review-text">{optionText(item, option)}</span>
                      {state.label ? <span className="quiz-review-tag">{state.label}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
