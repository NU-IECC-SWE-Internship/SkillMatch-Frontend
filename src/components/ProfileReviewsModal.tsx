import { useEffect, useState } from "react";
import { getUserReviews, type UserReview } from "../api/profileApi";
import "./ProfileReviewsModal.css";

interface ProfileReviewsModalProps {
  userId: number;
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

function getLoggedInUserId(): number | null {
  const token = localStorage.getItem("skillmatch_access");

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Number(payload.user_id);
  } catch {
    return null;
  }
}

export default function ProfileReviewsModal({
  userId,
  username,
  isOpen,
  onClose,
}: ProfileReviewsModalProps) {
  const [direction, setDirection] = useState<"received" | "given">("received");
  const [result, setResult] = useState<{
    key: string;
    reviews: UserReview[];
  } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const requestKey = `${userId}:${direction}`;

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    getUserReviews(userId, direction)
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, reviews: data });
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          console.error(requestError);
          setFailure({
            key: requestKey,
            message: "Could not load reviews. Please try again.",
          });
        }
      })

    return () => {
      cancelled = true;
    };
  }, [direction, isOpen, requestKey, userId]);

  const reviews = result?.key === requestKey ? result.reviews : [];
  const error = failure?.key === requestKey ? failure.message : "";
  const loading = isOpen && result?.key !== requestKey && !error;
  const loggedInUserId = getLoggedInUserId();
  const isOwnProfile = loggedInUserId === userId;

  if (!isOpen) return null;

  return (
    <div className="profile-reviews-backdrop" onClick={onClose}>
      <section
        className="profile-reviews-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-reviews-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="profile-reviews-header">
          <div>
            <h2 id="profile-reviews-title">{username}'s reviews</h2>
            <p>Only reviews published after the review window are shown.</p>
          </div>
          <button
            type="button"
            className="profile-reviews-close"
            onClick={onClose}
            aria-label="Close reviews"
          >
            ×
          </button>
        </header>

        <div className="profile-reviews-tabs" role="tablist" aria-label="Review type">
            <button
              type="button"
              role="tab"
              aria-selected={direction === "received"}
              className={direction === "received" ? "active" : ""}
              onClick={() => setDirection("received")}
            >
              Received
            </button>

            {isOwnProfile && (
              <button
                type="button"
                role="tab"
                aria-selected={direction === "given"}
                className={direction === "given" ? "active" : ""}
                onClick={() => setDirection("given")}
              >
                Given
              </button>
            )}
          </div>

        <div className="profile-reviews-list" aria-live="polite">
          {loading ? (
            <p className="profile-reviews-state">Loading reviews...</p>
          ) : error ? (
            <p className="profile-reviews-state error" role="alert">{error}</p>
          ) : reviews.length === 0 ? (
            <p className="profile-reviews-state">
              No {direction} reviews yet.
            </p>
          ) : (
            reviews.map((review) => {
              const otherUser =
                direction === "received"
                  ? review.reviewer_username
                  : review.reviewed_username;

              return (
                <article className="profile-review-card" key={review.id}>
                  <div className="profile-review-topline">
                    <strong>
                      {direction === "received" ? "From" : "For"} {otherUser}
                    </strong>
                    <span className="profile-review-score" aria-label={`${review.score} out of 5 stars`}>
                      {"★".repeat(review.score)}{"☆".repeat(5 - review.score)}
                      <span>{review.score}/5</span>
                    </span>
                  </div>
                  <p className="profile-review-feedback">
                    {review.feedback || "No written feedback provided."}
                  </p>
                  <time dateTime={review.created_at}>
                    {new Date(review.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
