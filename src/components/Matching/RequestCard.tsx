import type { IncomingRequestItem } from "../../api/matchingApi";
import { useState } from "react";
import UserRatingBadge from "./UserRatingBadge";

interface PendingRequestCardProps {
  request: IncomingRequestItem;
  isProcessing: boolean;
  processingAction: "accept" | "reject" | null;
  onAction: (
    requestId: number,
    action: "accept" | "reject",
    rejectionReason?: string,
    receiverSkill?: number
  ) => void;
  formatSlot: (request: IncomingRequestItem) => string;
}

export default function PendingRequestCard({
  request,
  isProcessing,
  processingAction,
  onAction,
  formatSlot,
}: PendingRequestCardProps) {
  const initial = request.sender_username
    ? request.sender_username.charAt(0).toUpperCase()
    : "?";

  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [showSkillSelector, setShowSkillSelector] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const senderTeachSkills = [
    ...(request.sender_teach_skills ?? []),
    { id: -1, name: "None" },
  ];

  const handleAccept = () => {
    if (!showSkillSelector) {
      setShowSkillSelector(true);
      return;
    }

    if (selectedSkill === null) {
      return;
    }

    onAction(
      request.id,
      "accept",
      undefined,
      selectedSkill === -1 ? undefined : selectedSkill
    );
  };

  return (
    <div className="incoming-card">
      <div className="incoming-card-top">
        <div className="sender-avatar">{initial}</div>

       <div>
          <div className="sender-title-rating">
            <h3 className="sender-name">{request.sender_username}</h3>
            <UserRatingBadge
              ratingAverage={request.sender_rating_average}
              ratingCount={request.sender_rating_count}
            />
          </div>
          <span className="request-tag">Wants to learn from you</span>
        </div>
      </div>

      <div className="swap-details">
        <div className="detail-item">
          <span className="detail-label">
            Requested Skill
          </span>

          <span className="skill-pill pill-learn">
            {request.skill_name || `Skill #${request.skill}`}
          </span>
        </div>

        <div className="detail-item">
          <span className="detail-label">
            Preferred Time Slot
          </span>

          <span className="slot-pill">
            {formatSlot(request)}
          </span>
        </div>
      </div>

      {showSkillSelector && (
        <div className="choose-skill-section">
          <span className="detail-label">
            Choose a skill you want to learn from{" "}
            {request.sender_username} or select None if you are not interested
          </span>

          <div className="skill-selector-list">
            {senderTeachSkills.length === 0 ? (
              <p className="no-skill-text">No teach skills available for this user.</p>
            ) : (
              senderTeachSkills.map((skill) => (
                <button
                  type="button"
                  key={skill.id}
                  className={`skill-choice-pill ${
                    selectedSkill === skill.id ? "selected" : ""
                  }`}
                  disabled={isProcessing}
                  onClick={() => setSelectedSkill(skill.id)}
                >
                  <span className="radio-indicator"></span>

                  <span className="skill-text">
                    {skill.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="incoming-card-actions">
        <button
          type="button"
          className="accept-btn"
          disabled={isProcessing || (showSkillSelector && selectedSkill === null)}
          onClick={handleAccept}
        >
          {processingAction === "accept"
            ? "Accepting..."
            : showSkillSelector
              ? "Confirm Accept"
              : "Accept Swap"}
        </button>

        <button
          type="button"
          className="decline-btn"
          disabled={isProcessing}
          onClick={() => setShowRejectForm(true)}
        >
          Decline
        </button>
      </div>

      {showRejectForm && (
        <div className="reject-form">
          <div className="reject-form-header">
            <h4>Decline this request</h4>

            <p>
              Please provide a short reason so the requester
              understands why you cannot accept the swap.
            </p>
          </div>

          <div className="reject-form-field">
            <label htmlFor={`reason-${request.id}`}>
              Reason
            </label>

            <textarea
              id={`reason-${request.id}`}
              value={rejectionReason}
              onChange={(e) =>
                setRejectionReason(e.target.value)
              }
              placeholder="e.g. I'm not available at the selected time."
              rows={4}
            />
          </div>

          <div className="reject-form-actions">
            <button
              type="button"
              className="cancel-reject-btn"
              disabled={isProcessing}
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="confirm-reject-btn"
              disabled={
                isProcessing ||
                rejectionReason.trim().length === 0
              }
              onClick={() =>
                onAction(
                  request.id,
                  "reject",
                  rejectionReason.trim()
                )
              }
            >
              {processingAction === "reject"
                ? "Rejecting..."
                : "Confirm Rejection"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}