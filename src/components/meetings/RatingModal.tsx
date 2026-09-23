import React, { useState } from 'react';
import { submitMeetingRating, type Meeting } from '../../api/meetingsApi';
import './Meetings.css';

export interface RatingModalProps {
  isOpen: boolean;
  meeting: Meeting | null;
  onClose: () => void;
  onSuccess: (updatedMeeting: Meeting, message: string) => void;
}

const STAR_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Exceptional Skill Swap!',
};

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  meeting,
  onClose,
  onSuccess,
}) => {
  const [score, setScore] = useState<number>(5);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !meeting) return null;

  const partnerName = meeting.partner_name || meeting.participant_b_name || 'your partner';
  const displayScore = hoveredScore !== null ? hoveredScore : score;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!score || score < 1 || score > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await submitMeetingRating(meeting.id, score, feedback);
      onSuccess(res.meeting, res.message);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="rating-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="rating-modal-header">
          <div>
            <span className="rating-modal-badge">Post-Session Feedback</span>
            <h2 className="rating-modal-title">Rate Your Swap with {partnerName}</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="rating-alert error">{error}</div>}

          {/* Blind Review Notice */}
          <div className="blind-review-callout">
            <span className="callout-icon">🔒</span>
            <div className="callout-content">
              <strong>Double-Blind Guarantee</strong>
              <p>
                Your score and notes remain strictly confidential. {partnerName} cannot see your review
                until they submit their review or 48 hours pass. It will not affect their score until unlocked.
              </p>
            </div>
          </div>

          {/* Star Rating Section */}
          <div className="star-rating-section">
            <label className="rating-field-label">Your Experience Rating</label>
            <div className="stars-row" onMouseLeave={() => setHoveredScore(null)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`star-btn ${star <= displayScore ? 'filled' : ''}`}
                  onClick={() => setScore(star)}
                  onMouseEnter={() => setHoveredScore(star)}
                  aria-label={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
            <span className="star-feedback-label">
              {STAR_LABELS[displayScore] || 'Select rating'}
            </span>
          </div>

          {/* Feedback Textarea */}
          <div className="rating-input-group">
            <label className="rating-field-label" htmlFor="feedback-input">
              Session Feedback / Notes <span className="label-optional">(Optional)</span>
            </label>
            <textarea
              id="feedback-input"
              rows={3}
              className="rating-textarea"
              placeholder={`What went well? How was ${partnerName}'s skill instruction or communication?`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Actions */}
          <div className="rating-modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Maybe Later
            </button>
            <button
              type="submit"
              className="btn-schedule"
              disabled={submitting}
            >
              {submitting ? 'Submitting Review...' : 'Submit Blind Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
