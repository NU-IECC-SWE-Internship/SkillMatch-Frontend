import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { IncomingRequestItem } from "../../api/matchingApi";
import VerifiedBadge from "../VerifiedBadge";
import UserRatingBadge from "./UserRatingBadge";
import ReturnSessionScheduler, {
  type ReturnScheduleSelection,
} from "./ReturnSessionScheduler";

interface PendingRequestCardProps {
  request: IncomingRequestItem;
  isProcessing: boolean;
  processingAction: "accept" | "reject" | "schedule_return" | null;
  onAction: (
    requestId: number,
    action: "accept" | "reject" | "schedule_return",
    rejectionReason?: string,
    receiverSkill?: number,
    scheduleMode?: "now" | "later",
    receiverSelectedSlot?: number,
    receiverRequestedStartTime?: string,
    receiverRequestedEndTime?: string
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
  const location = useLocation();
  const initial = request.sender_username
    ? request.sender_username.charAt(0).toUpperCase()
    : "?";

  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [showSkillSelector, setShowSkillSelector] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [scheduleMode, setScheduleMode] = useState<"now" | "later" | null>(
    null
  );

  const [showReturnScheduler, setShowReturnScheduler] = useState(false);

  const [returnSchedule, setReturnSchedule] =
    useState<ReturnScheduleSelection | null>(null);

  const senderTeachSkills = [
    ...(request.sender_teach_skills ?? []),
    { id: -1, name: "None" },
  ];

  const handleSkillSelect = (skillId: number) => {
    setSelectedSkill(skillId);
    setScheduleMode(null);
    setReturnSchedule(null);
  };

  const handleScheduleMode = (mode: "now" | "later") => {
    setScheduleMode(mode);
    setReturnSchedule(null);
  };

  const handleAccept = () => {
    if (showRejectForm) {
      setShowRejectForm(false);
      setRejectionReason("");
    }

    if (!showSkillSelector) {
      setShowSkillSelector(true);
      return;
    }

    if (selectedSkill === null) {
      return;
    }

    if (selectedSkill === -1) {
      onAction(request.id, "accept");
      return;
    }

    if (!scheduleMode) {
      return;
    }

    if (scheduleMode === "later") {
      onAction(
        request.id,
        "accept",
        undefined,
        selectedSkill,
        "later"
      );
      return;
    }

    if (!returnSchedule) {
      return;
    }

    onAction(
      request.id,
      "accept",
      undefined,
      selectedSkill,
      "now",
      returnSchedule.slotId,
      returnSchedule.startTime,
      returnSchedule.endTime
    );
  };

  const handleScheduleReturn = () => {
    if (!returnSchedule) {
      return;
    }

    onAction(
      request.id,
      "schedule_return",
      undefined,
      undefined,
      undefined,
      returnSchedule.slotId,
      returnSchedule.startTime,
      returnSchedule.endTime
    );
  };

  const handleDecline = () => {
    if (showSkillSelector) {
      setShowSkillSelector(false);
      setSelectedSkill(null);
      setScheduleMode(null);
      setReturnSchedule(null);
    }

    setShowRejectForm((current) => !current);

    if (showRejectForm) {
      setRejectionReason("");
    }
  };

  const acceptDisabled =
    isProcessing ||
    (showSkillSelector && selectedSkill === null) ||
    (showSkillSelector &&
      selectedSkill !== null &&
      selectedSkill !== -1 &&
      scheduleMode === null) ||
    (showSkillSelector &&
      selectedSkill !== null &&
      selectedSkill !== -1 &&
      scheduleMode === "now" &&
      !returnSchedule);

  return (
    <div className="incoming-card">
      <div className="incoming-card-top">
        <div className="sender-avatar">{initial}</div>

        <div>
          <div className="sender-title-rating">
            <h3 className="sender-name">
              <Link
                className="sender-name-link"
                to={`/users/${request.sender}`}
                state={{ from: `${location.pathname}${location.search}` }}
              >
                {request.sender_username}
              </Link>
            </h3>

            <UserRatingBadge
              ratingAverage={request.sender_rating_average}
              ratingCount={request.sender_rating_count}
            />
          </div>

          <span className="request-tag">
            {request.status === "SCHEDULING"
              ? "Swap accepted · return session needs a time"
              : "Wants to learn from you"}
          </span>
        </div>
      </div>

      <div className="swap-details">
        <div className="detail-item">
          <span className="detail-label">Requested Skill</span>

          <span
            className={
              request.skill_is_verified
                ? "skill-pill pill-learn is-verified"
                : "skill-pill pill-learn"
            }
          >
            {request.skill_name || `Skill #${request.skill}`}

            <VerifiedBadge
              verified={!!request.skill_is_verified}
              compact
            />
          </span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Preferred Time Slot</span>

          <span className="slot-pill">{formatSlot(request)}</span>
        </div>
      </div>

      {request.status === "PENDING" && showSkillSelector && (
        <div className="choose-skill-section">
          <span className="detail-label">
            Choose a skill you want to learn from {request.sender_username} or
            select None if you are not interested
          </span>

          <div className="skill-selector-list">
            {senderTeachSkills.length === 0 ? (
              <p className="no-skill-text">
                No teach skills available for this user.
              </p>
            ) : (
              senderTeachSkills.map((skill) => (
                <button
                  type="button"
                  key={skill.id}
                  className={`skill-choice-pill ${
                    selectedSkill === skill.id ? "selected" : ""
                  }`}
                  disabled={isProcessing}
                  onClick={() => handleSkillSelect(skill.id)}
                >
                  <span className="radio-indicator"></span>

                  <span className="skill-text">
                    {skill.name}

                    {skill.id !== -1 && (
                      <VerifiedBadge
                        verified={!!skill.is_verified}
                        compact
                      />
                    )}
                  </span>
                </button>
              ))
            )}
          </div>

          {selectedSkill !== null && selectedSkill !== -1 && (
            <div className="schedule-choice-section">
              <span className="detail-label">
                When do you want to choose the time for your session?
              </span>

              <div className="schedule-choice-actions">
                <button
                  type="button"
                  className={`schedule-choice-btn ${
                    scheduleMode === "now" ? "selected" : ""
                  }`}
                  disabled={isProcessing}
                  onClick={() => handleScheduleMode("now")}
                >
                  Choose Time Now
                </button>

                <button
                  type="button"
                  className={`schedule-choice-btn ${
                    scheduleMode === "later" ? "selected" : ""
                  }`}
                  disabled={isProcessing}
                  onClick={() => handleScheduleMode("later")}
                >
                  Choose Later
                </button>
              </div>
            </div>
          )}

          {selectedSkill !== null &&
            selectedSkill !== -1 &&
            scheduleMode === "now" && (
              <ReturnSessionScheduler
                userId={request.sender}
                username={request.sender_username}
                isProcessing={isProcessing}
                onChange={setReturnSchedule}
              />
            )}

          {selectedSkill !== null &&
            selectedSkill !== -1 &&
            scheduleMode === "later" && (
              <div className="schedule-later-message">
                You can accept the swap now and choose a time from{" "}
                {request.sender_username}&apos;s availability later.
              </div>
            )}
        </div>
      )}

      {request.status === "SCHEDULING" && (
        <div className="scheduling-section">
          <div className="scheduling-section-top">
            <div>
              <span className="detail-label">Return Skill</span>

              <strong>
                {request.receiver_skill_name || "Selected skill"}
              </strong>
            </div>

            {!showReturnScheduler && (
              <button
                type="button"
                className="accept-btn"
                disabled={isProcessing}
                onClick={() => {
                  setReturnSchedule(null);
                  setShowReturnScheduler(true);
                }}
              >
                Choose Time
              </button>
            )}
          </div>

          {showReturnScheduler && (
            <>
              <ReturnSessionScheduler
                userId={request.sender}
                username={request.sender_username}
                isProcessing={isProcessing}
                onChange={setReturnSchedule}
              />

              <div className="schedule-return-actions">
                <button
                  type="button"
                  className="decline-btn"
                  disabled={isProcessing}
                  onClick={() => {
                    setShowReturnScheduler(false);
                    setReturnSchedule(null);
                  }}
                >
                  Choose Later
                </button>

                <button
                  type="button"
                  className="accept-btn"
                  disabled={isProcessing || !returnSchedule}
                  onClick={handleScheduleReturn}
                >
                  {processingAction === "schedule_return"
                    ? "Scheduling..."
                    : "Schedule Session"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {request.status === "PENDING" && (
        <div className="incoming-card-actions">
          <button
            type="button"
            className="accept-btn"
            disabled={acceptDisabled}
            onClick={handleAccept}
          >
            {processingAction === "accept"
              ? "Accepting..."
              : !showSkillSelector
                ? "Accept Swap"
                : selectedSkill !== null &&
                    selectedSkill !== -1 &&
                    scheduleMode === "now"
                  ? "Confirm & Schedule"
                  : "Confirm Accept"}
          </button>

          <button
            type="button"
            className="decline-btn"
            disabled={isProcessing}
            onClick={handleDecline}
          >
            {showRejectForm ? "Close" : "Decline"}
          </button>
        </div>
      )}

      {request.status === "PENDING" && showRejectForm && (
        <div className="reject-form">
          <div className="reject-form-header">
            <h4>Decline this request</h4>

            <p>
              Please provide a short reason so the requester understands why
              you cannot accept the swap.
            </p>
          </div>

          <div className="reject-form-field">
            <label htmlFor={`reason-${request.id}`}>Reason</label>

            <textarea
              id={`reason-${request.id}`}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
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
              disabled={isProcessing || rejectionReason.trim().length === 0}
              onClick={() =>
                onAction(request.id, "reject", rejectionReason.trim())
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
