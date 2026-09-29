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
    action: "accept" | "reject" | "schedule_return";
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
    action: "accept" | "reject" | "schedule_return",
    rejectionReason?: string,
    receiverSkill?: number,
    scheduleMode?: "now" | "later",
    receiverSelectedSlot?: number,
    receiverRequestedStartTime?: string,
    receiverRequestedEndTime?: string
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
        receiverSkill,
        scheduleMode,
        receiverSelectedSlot,
        receiverRequestedStartTime,
        receiverRequestedEndTime
      );

      if (action === "reject") {
        setStatusModal({
          title: "Request declined",
          message: response.message,
          type: "success",
        });
      } else if (action === "schedule_return") {
        setStatusModal({
          title: "Session scheduled",
          message: response.message,
          type: "success",
        });
      } else if (response.status === "SCHEDULING") {
        setStatusModal({
          title: "Swap accepted",
          message: response.message,
          type: "success",
        });
      } else {
        setStatusModal({
          title: "Swap scheduled",
          message: response.message,
          type: "success",
        });
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: response.status,
                rejection_reason:
                  action === "reject"
                    ? response.rejection_reason ??
                      rejectionReason ??
                      null
                    : null,
                receiver_skill:
                  response.receiver_skill !== undefined
                    ? response.receiver_skill
                    : req.receiver_skill,
                receiver_skill_name:
                  response.receiver_skill_name !== undefined
                    ? response.receiver_skill_name
                    : req.receiver_skill_name,
              }
            : req
        )
      );
    } catch (err) {
      const message = getErrorMessage(err);

      setStatusModal({
        title:
          action === "reject"
            ? "Decline failed"
            : action === "schedule_return"
              ? "Scheduling failed"
              : "Accept failed",
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

  const pendingRequests = requests.filter(
    (request) =>
      request.status === "PENDING" || request.status === "SCHEDULING"
  );

  const pastRequests = requests.filter(
    (request) =>
      request.status !== "PENDING" && request.status !== "SCHEDULING"
  );

  const formatTime = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);

    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHours = ((hours + 11) % 12) + 1;

    return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
  };

  const formatSlot = (request: IncomingRequestItem) => {
    if (!request.selected_slot_day) {
      return `Slot #${request.selected_slot}`;
    }

    const day =
      request.selected_slot_day.charAt(0).toUpperCase() +
      request.selected_slot_day.slice(1);

    return `${day}, ${formatTime(
      request.selected_slot_start_time
    )} – ${formatTime(request.selected_slot_end_time)}`;
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
                    {pendingRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        isProcessing={processingAction?.id === request.id}
                        processingAction={
                          processingAction?.id === request.id
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
                    {pastRequests.map((request) => (
                      <PastRequestCard
                        key={request.id}
                        request={request}
                      />
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