import type { IncomingRequestItem } from "../../api/matchingApi";
import { useState } from "react";

interface PendingRequestCardProps {
  request: IncomingRequestItem;
  isProcessing: boolean;
  processingAction: "accept" | "reject" | null;
  onAction: (
    requestId: number,
    action: "accept" | "reject",
    rejectionReason?: string
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
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

  return (
    <div className="incoming-card">
      <div className="incoming-card-top">
        <div className="sender-avatar">{initial}</div>

        <div>
          <h3 className="sender-name">{request.sender_username}</h3>
          <span className="request-tag">Wants to learn from you</span>
        </div>
      </div>

      <div className="swap-details">
        <div className="detail-item">
          <span className="detail-label">Requested Skill</span>

          <span className="skill-pill pill-learn">
            {request.skill_name || `Skill #${request.skill}`}
          </span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Preferred Time Slot</span>

          <span className="slot-pill">
            {formatSlot(request)}
          </span>
        </div>
      </div>

      <div className="incoming-card-actions">
        <button
            type="button"
            className="accept-btn"
            disabled={isProcessing}
            onClick={() => onAction(request.id, "accept")}
        >
            {processingAction === "accept"
            ? "Accepting..."
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
                    Please provide a short reason so the requester understands
                    why you cannot accept the swap.
                </p>
                </div>

                <div className="reject-form-field">
                <label htmlFor={`reason-${request.id}`}>
                    Reason
                </label>

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