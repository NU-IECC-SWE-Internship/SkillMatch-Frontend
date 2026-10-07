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
import {
  PersonHeader,
  RequestSection,
  RequestsHeader,
  StatusChip,
} from "../components/Matching/RequestsLayout";
import StatusModal from "../components/ui/StatusModal";
import { handleCursorGlow } from "../lib/cursorGlow";
import "./Requests.css";

const PAST_PREVIEW_COUNT = 3;

export default function Requests() {
  const [requests, setRequests] = useState<IncomingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllPast, setShowAllPast] = useState(false);

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
          title: "Time proposed",
          message: response.message,
          type: "success",
        });
      } else if (response.status === "SCHEDULING") {
        setStatusModal({
          title: "Swap accepted",
          message: response.message,
          type: "success",
        });
      } else if (response.status === "CONFIRMING") {
        setStatusModal({
          title: "Waiting for confirmation",
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

  const waitingRequests = requests.filter(
    (request) => request.status === "CONFIRMING"
  );

  const pastRequests = requests.filter(
    (request) =>
      request.status === "ACCEPTED" || request.status === "REJECTED"
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

  const formatReturnSlot = (request: IncomingRequestItem) => {
    const dayValue = request.receiver_selected_slot_day;

    const startTime =
      request.receiver_requested_start_time ||
      request.receiver_selected_slot_start_time;

    const endTime =
      request.receiver_requested_end_time ||
      request.receiver_selected_slot_end_time;

    if (!dayValue || !startTime || !endTime) {
      return "Return session time proposed";
    }

    const day =
      dayValue.charAt(0).toUpperCase() +
      dayValue.slice(1);

    return `${day}, ${formatTime(startTime)} – ${formatTime(endTime)}`;
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

      <main className="requests-page fx-backdrop" onPointerMove={handleCursorGlow}>
        <div className="requests-container">
          <RequestsHeader
            title="Swap requests"
            subtitle="People who want to exchange skills with you."
          />

          {loading ? (
            <div className="requests-skeleton-list">
              {[0, 1].map((n) => (
                <div className="requests-skeleton" key={n} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="requests-empty">
              <h3>No requests yet</h3>

              <p>
                When someone asks to swap skills with you, it will show up
                here.
              </p>

              <Link to="/skillbrowse" className="browse-skills-btn">
                Browse Skills
              </Link>
            </div>
          ) : (
            <>
              <RequestSection
                title="Needs your response"
                count={pendingRequests.length}
                highlight
              >
                {pendingRequests.length === 0 ? (
                  <p className="no-pending-text">
                    You&apos;re all caught up.
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
              </RequestSection>

              {waitingRequests.length > 0 && (
                <RequestSection
                  title="Waiting on them"
                  count={waitingRequests.length}
                  hint="You proposed a return session time. They need to confirm it."
                >
                  <div className="requests-grid">
                    {waitingRequests.map((request) => (
                      <div
                        className="incoming-card fx-glow fx-accent-top fx-pop fx-theme-amber"
                        key={request.id}
                      >
                        <PersonHeader
                          userId={request.sender}
                          username={request.sender_username}
                          ratingAverage={request.sender_rating_average}
                          ratingCount={request.sender_rating_count}
                          subtitle="Waiting for them to confirm your proposed time"
                          status={
                            <StatusChip tone="pending">Awaiting reply</StatusChip>
                          }
                        />

                        <div className="swap-details">
                          <div className="detail-item">
                            <span className="detail-label">You learn</span>
                            <span className="slot-pill">
                              {request.receiver_skill_name ?? "Return skill"}
                            </span>
                          </div>

                          <div className="detail-item">
                            <span className="detail-label">Proposed time</span>
                            <span className="slot-pill">
                              {formatReturnSlot(request)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RequestSection>
              )}

              {pastRequests.length > 0 && (
                <RequestSection title="History" count={pastRequests.length}>
                  <div className="requests-grid compact">
                    {(showAllPast
                      ? pastRequests
                      : pastRequests.slice(0, PAST_PREVIEW_COUNT)
                    ).map((request) => (
                      <PastRequestCard key={request.id} request={request} />
                    ))}
                  </div>

                  {pastRequests.length > PAST_PREVIEW_COUNT && (
                    <button
                      type="button"
                      className="show-more-btn"
                      onClick={() => setShowAllPast((current) => !current)}
                    >
                      {showAllPast
                        ? "Show less"
                        : `Show all ${pastRequests.length}`}
                    </button>
                  )}
                </RequestSection>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

