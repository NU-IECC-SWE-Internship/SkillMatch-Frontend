import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getIncomingRequests,
  respondToMatchRequest,
  type IncomingRequestItem,
} from "../api/matchingApi";
import { getErrorMessage } from "../lib/api";
import RequestCard from "../components/Matching/RequestCard";
import PastRequestCard from "../components/Matching/PastRequestCard";
import StatusModal from "../components/ui/StatusModal";
import "./Requests.css";

export default function Requests() {
  const [requests, setRequests] = useState<IncomingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<{
    id: number;
    action: "accept" | "reject";
  } | null>(null);
  const [statusModal, setStatusModal] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getIncomingRequests();
      setRequests(data);
    } catch (err) {
      setStatusModal({
        title: "Request load failed",
        message: getErrorMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (
    requestId: number,
    action: "accept" | "reject",
    rejectionReason?: string,
    receiverSkill?: number
  ) => {
    try {
      setProcessingAction({
        id: requestId,
        action,
      });
      setStatusModal(null);

      const response = await respondToMatchRequest(
        requestId,
        action,
        rejectionReason,
        undefined,
        receiverSkill
      );

      if (action === "accept") {
        setStatusModal({
          title: "Swap accepted",
          message:
            "Meeting scheduled successfully. You can join it in the Meetings tab.",
          type: "success",
        });
      } else {
        setStatusModal({
          title: "Request declined",
          message: "This swap request has been declined.",
          type: "success",
        });
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: action === "accept" ? "ACCEPTED" : "REJECTED",
                rejection_reason:
                  action === "reject"
                    ? response.rejection_reason ?? rejectionReason ?? null
                    : null,
                receiver_skill:
                  action === "accept"
                    ? response.receiver_skill ?? req.receiver_skill ?? null
                    : req.receiver_skill,
                receiver_skill_name:
                  action === "accept"
                    ? response.receiver_skill_name ??
                      req.receiver_skill_name ??
                      null
                    : req.receiver_skill_name,
              }
            : req
        )
      );
    } catch (err) {
      const message = getErrorMessage(err);
      setStatusModal({
        title: action === "accept" ? "Accept failed" : "Decline failed",
        message,
        type: "error",
      });

      if (message.toLowerCase().includes("already been processed")) {
        await loadRequests();
      }
    } finally {
      setProcessingAction(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const pastRequests = requests.filter((r) => r.status !== "PENDING");

  const formatTime = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHours = ((hours + 11) % 12) + 1;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
  };

  const formatSlot = (request: IncomingRequestItem) => {
    if (!request.selected_slot_day) return `Slot #${request.selected_slot}`;
    const day =
      request.selected_slot_day.charAt(0).toUpperCase() +
      request.selected_slot_day.slice(1);
    return `${day}, ${formatTime(request.selected_slot_start_time)} – ${formatTime(
      request.selected_slot_end_time
    )}`;
  };

  return (
    <>
      <StatusModal
        isOpen={Boolean(statusModal)}
        title={statusModal?.title ?? ""}
        message={statusModal?.message ?? ""}
        type={statusModal?.type ?? "success"}
        onClose={() => setStatusModal(null)}
      />

      <main className="requests-page">
        <div className="requests-container">
          <div className="requests-topbar">
            <Link to="/dashboard" className="requests-nav-link">
              &larr; Back to Dashboard
            </Link>
            <span className="requests-brand">SkillMatch</span>
          </div>

          <header className="requests-header">
            <h1>Incoming Swap Requests</h1>
            <p>People who want to exchange skills with you.</p>
          </header>

          {loading ? (
            <div className="requests-empty">
              <p>Loading incoming requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="requests-empty">
              <h3>No requests yet</h3>
              <p>
                When another user requests a skill swap with you, it will appear
                here.
              </p>
              <Link to="/matches" className="browse-matches-btn">
                Browse Matches
              </Link>
            </div>
          ) : (
            <>
              <section className="requests-group">
                <h2 className="group-title">
                  Needs Your Response ({pendingRequests.length})
                </h2>

                {pendingRequests.length === 0 ? (
                  <p className="no-pending-text">
                    All caught up! No pending requests.
                  </p>
                ) : (
                  <div className="requests-grid">
                    {pendingRequests.map((req) => (
                      <RequestCard
                        key={req.id}
                        request={req}
                        isProcessing={processingAction?.id === req.id}
                        processingAction={
                          processingAction?.id === req.id
                            ? processingAction.action
                            : null
                        }
                        onAction={handleAction}
                        formatSlot={formatSlot}
                      />
                    ))}
                  </div>
                )}
              </section>

              {pastRequests.length > 0 && (
                <section className="requests-group past-group">
                  <h2 className="group-title">Previous Requests</h2>
                  <div className="requests-grid">
                    {pastRequests.map((req) => (
                      <PastRequestCard key={req.id} request={req} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
