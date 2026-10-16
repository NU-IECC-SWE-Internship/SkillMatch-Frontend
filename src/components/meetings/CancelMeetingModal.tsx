import React, { useState } from 'react';
import { cancelMeeting, type Meeting } from '../../api/meetingsApi';
import './Meetings.css';

export interface CancelMeetingModalProps {
  isOpen: boolean;
  meeting: Meeting | null;
  onClose: () => void;
  onSuccess: (cancelledMeetingId: number, message: string) => void;
}

const PRESET_REASONS = [
  'Schedule conflict',
  'Personal emergency',
  'Need to reschedule for later date',
  'Technical or hardware difficulties',
  'Other commitment',
];

const CancelMeetingModal: React.FC<CancelMeetingModalProps> = ({
  isOpen,
  meeting,
  onClose,
  onSuccess,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !meeting) return null;

  const partnerName = meeting.partner_name || meeting.participant_b_name || 'your partner';
  const noticeHours = meeting.cancel_notice_hours || 2;
  const startDate = new Date(meeting.start_time_ts);

  const activeReason = customReason.trim() || selectedPreset;

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    if (!customReason) {
      setCustomReason(preset);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = activeReason.trim();

    if (!finalReason) {
      setError('Please provide a reason for cancelling this session.');
      return;
    }

    if (finalReason.length < 5) {
      setError('Please enter a slightly more descriptive reason (at least 5 characters).');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await cancelMeeting(meeting.id, finalReason);
      onSuccess(meeting.id, res.message || 'Meeting cancelled successfully.');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="rating-modal-card cancel-meeting-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="rating-modal-header">
          <div>
            <span className="rating-modal-badge cancel-badge">Session Cancellation</span>
            <h2 className="rating-modal-title">Cancel Meeting Session</h2>
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

        {/* Meeting Overview Pill */}
        <div className="cancel-meeting-summary">
          <div className="summary-row">
            <span className="summary-label">Partner:</span>
            <span className="summary-value"><strong>{partnerName}</strong></span>
          </div>
          {meeting.skill_name && (
            <div className="summary-row">
              <span className="summary-label">Topic / Skill:</span>
              <span className="summary-value">{meeting.skill_name}</span>
            </div>
          )}
          <div className="summary-row">
            <span className="summary-label">Scheduled Time:</span>
            <span className="summary-value">
              {startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Policy Callout */}
        <div className="cancel-policy-callout">
          <div className="callout-icon">ℹ️</div>
          <div className="callout-content">
            <strong>Cancellation Notice Policy</strong>
            <p>
              Scheduled sessions can only be cancelled with at least <strong>{noticeHours} hours</strong> advance notice.
              Your reason will be shared with {partnerName} so they can plan accordingly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="rating-alert error">{error}</div>}

          {/* Quick Reason Chips */}
          <div className="cancel-reason-section">
            <label className="rating-field-label">
              Select or type a reason <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="cancel-chips-grid">
              {PRESET_REASONS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={`cancel-chip ${selectedPreset === preset ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Textarea */}
          <div className="rating-input-group" style={{ marginTop: '0.75rem' }}>
            <label className="rating-field-label" htmlFor="cancellation-reason-text">
              Cancellation details for {partnerName}:
            </label>
            <textarea
              id="cancellation-reason-text"
              rows={3}
              className="rating-textarea"
              placeholder="Provide context or explanation for why you need to cancel..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              disabled={submitting}
              required
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
              Keep Session
            </button>
            <button
              type="submit"
              className="btn-danger-action"
              disabled={submitting || !activeReason.trim()}
            >
              {submitting ? 'Cancelling Session...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelMeetingModal;
