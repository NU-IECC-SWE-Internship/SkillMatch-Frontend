import React from 'react';
import type { Meeting } from '../../api/meetingsApi';
import './Meetings.css';

export interface ViewReviewModalProps {
  isOpen: boolean;
  meeting: Meeting | null;
  onClose: () => void;
  onOpenRateModal?: (meeting: Meeting) => void;
}

const ViewReviewModal: React.FC<ViewReviewModalProps> = ({
  isOpen,
  meeting,
  onClose,
  onOpenRateModal,
}) => {
  if (!isOpen || !meeting) return null;

  const partnerName = meeting.partner_name || meeting.participant_b_name || 'Partner';
  const now = Date.now();
  const deadlineTs = meeting.review_deadline_ts || (meeting.end_time_ts + 48 * 60 * 60 * 1000);
  const hoursLeft = Math.max(0, Math.ceil((deadlineTs - now) / (1000 * 60 * 60)));
  const isDeadlinePassed = now > deadlineTs;

  const renderStars = (score: number | null) => {
    if (!score) return null;
    return (
      <div className="review-stars-display" aria-label={`${score} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={`star-icon ${s <= score ? 'active' : ''}`}>
            ★
          </span>
        ))}
        <span className="score-number">{score} / 5</span>
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="review-details-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="rating-modal-header">
          <div>
            <span className="rating-modal-badge">
              {meeting.is_revealed ? '✨ Published Feedback' : '🔒 Double-Blind In Progress'}
            </span>
            <h2 className="rating-modal-title">Reviews for Swap with {partnerName}</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="review-cards-container">
          {/* Section 1: Your Review */}
          <div className="review-summary-card">
            <div className="review-summary-header">
              <span className="review-card-tag your-tag">Your Review of {partnerName}</span>
              {meeting.has_user_rated ? (
                <span className="status-badge-mini submitted">Submitted</span>
              ) : isDeadlinePassed ? (
                <span className="status-badge-mini expired">Expired</span>
              ) : (
                <span className="status-badge-mini pending">Action Required</span>
              )}
            </div>

            {meeting.has_user_rated && meeting.user_review ? (
              <div className="review-card-body">
                {renderStars(meeting.user_review.score)}
                <p className="review-feedback-text">
                  {meeting.user_review.feedback
                    ? `“${meeting.user_review.feedback}”`
                    : 'No written notes provided.'}
                </p>
                <span className="review-date-stamp">
                  Submitted on{' '}
                  {new Date(meeting.user_review.created_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ) : meeting.can_review ? (
              <div className="review-card-empty-action">
                <p>You have not reviewed {partnerName} yet. Rate them to help the community and unlock their feedback!</p>
                <button
                  type="button"
                  className="btn-schedule"
                  style={{ marginTop: '0.75rem', alignSelf: 'flex-start' }}
                  onClick={() => {
                    onClose();
                    if (onOpenRateModal) onOpenRateModal(meeting);
                  }}
                >
                  ★ Leave Review for {partnerName}
                </button>
              </div>
            ) : (
              <div className="review-card-empty">
                <p>The 48-hour review window has concluded. Unsubmitted reviews are locked to prevent retaliation.</p>
              </div>
            )}
          </div>

          {/* Section 2: Partner's Review */}
          <div className="review-summary-card">
            <div className="review-summary-header">
              <span className="review-card-tag partner-tag">{partnerName}'s Review of You</span>
              {meeting.is_revealed ? (
                <span className="status-badge-mini revealed">Revealed</span>
              ) : meeting.has_partner_rated ? (
                <span className="status-badge-mini submitted">Submitted (Private)</span>
              ) : isDeadlinePassed ? (
                <span className="status-badge-mini expired">Not Submitted</span>
              ) : (
                <span className="status-badge-mini pending">Pending Partner</span>
              )}
            </div>

            {meeting.is_revealed ? (
              meeting.partner_review && meeting.partner_review.score ? (
                <div className="review-card-body">
                  {renderStars(meeting.partner_review.score)}
                  <p className="review-feedback-text">
                    {meeting.partner_review.feedback
                      ? `“${meeting.partner_review.feedback}”`
                      : 'No written comments provided.'}
                  </p>
                  <span className="review-date-stamp">
                    Published on{' '}
                    {new Date(meeting.partner_review.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ) : (
                <div className="review-card-empty">
                  <p>{partnerName} did not submit a review within the 48-hour window.</p>
                </div>
              )
            ) : (
              <div className="review-card-locked">
                <div className="locked-icon">🔒</div>
                <h4>Review Hidden Under Blind Review Policy</h4>
                <p>
                  {meeting.has_partner_rated
                    ? `${partnerName} has already submitted their review! It remains private until you submit your review or the 48-hour window concludes.`
                    : `${partnerName} has not submitted their review yet.`}
                </p>
                <div className="countdown-pill">
                  ⏱️ Automatic unlock deadline in{' '}
                  <strong>{hoursLeft} hour{hoursLeft === 1 ? '' : 's'}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rating-modal-actions" style={{ marginTop: '1.5rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewReviewModal;
