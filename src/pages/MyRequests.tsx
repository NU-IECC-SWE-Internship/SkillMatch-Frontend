import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getSentRequests,
  respondToMatchRequest,
  type MatchRequest,
} from "../api/matchingApi";

import { getErrorMessage } from "../lib/api";
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

export default function MyRequests() {
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllPast, setShowAllPast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [processingAction, setProcessingAction] = useState<{
    id: number;
    action: "confirm_return" | "decline_return";
  } | null>(null);

  const [statusModal, setStatusModal] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const data = await getSentRequests();

      setRequests(data);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReturnAction = async (
    requestId: number,
    action: "confirm_return" | "decline_return"
  ) => {
    try {
      setProcessingAction({
        id: requestId,
        action,
      });

      setStatusModal(null);

      const response = await respondToMatchRequest(
        requestId,
        action
      );

      setStatusModal({
        title:
          action === "confirm_return"
            ? "Return session confirmed"
            : "Return time declined",
        message: response.message,
        type: "success",
      });

      await loadRequests();
    } catch (err) {
      setStatusModal({
        title:
          action === "confirm_return"
            ? "Confirmation failed"
            : "Decline failed",
        message: getErrorMessage(err),
        type: "error",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING"
  );

  const schedulingRequests = requests.filter(
    (request) => request.status === "SCHEDULING"
  );

  const confirmingRequests = requests.filter(
    (request) => request.status === "CONFIRMING"
  );

  const pastRequests = requests.filter(
    (request) =>
      request.status === "ACCEPTED" ||
      request.status === "REJECTED"
  );

  const formatTime = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);

    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHours = ((hours + 11) % 12) + 1;

    return `${displayHours}:${String(minutes).padStart(
      2,
      "0"
    )} ${suffix}`;
  };

  const formatSlot = (request: MatchRequest) => {
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

  const formatReturnSlot = (request: MatchRequest) => {
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

    return `${day}, ${formatTime(startTime)} – ${formatTime(
      endTime
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

      <main className="requests-page fx-backdrop" onPointerMove={handleCursorGlow}>
        <div className="requests-container">
          <RequestsHeader
            title="Swap requests"
            subtitle="Requests you've sent to other people."
          />

          {errorMessage && (
            <div className="error-banner" role="alert">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="requests-skeleton-list">
              {[0, 1].map((n) => (
                <div className="requests-skeleton" key={n} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="requests-empty">
              <h3>No requests yet</h3>

              <p>You haven&apos;t sent any skill swap requests yet.</p>

              <Link to="/skillbrowse" className="browse-skills-btn">
                Browse Skills
              </Link>
            </div>
          ) : (
            <>
              {confirmingRequests.length > 0 && (
                <RequestSection
                  title="Needs your confirmation"
                  count={confirmingRequests.length}
                  hint="They picked a time for your return session. Accept it or decline to let them choose again."
                  highlight
                >
                  <div className="requests-grid">
                    {confirmingRequests.map((request) => {
                      const busy = processingAction?.id === request.id;

                      return (
                        <div key={request.id} className="incoming-card fx-glow fx-accent-top fx-pop fx-theme-violet">
                          <PersonHeader
                            userId={request.receiver}
                            username={request.receiver_username}
                            ratingAverage={request.receiver_rating_average}
                            ratingCount={request.receiver_rating_count}
                            subtitle="Proposed a time for your return session"
                            status={
                              <StatusChip tone="action">Confirm time</StatusChip>
                            }
                          />

                          <div className="swap-details">
                            <div className="detail-item">
                              <span className="detail-label">You teach</span>
                              <span className="slot-pill">
                                {request.receiver_skill_name || "Selected skill"}
                              </span>
                            </div>

                            <div className="detail-item">
                              <span className="detail-label">Proposed time</span>
                              <span className="slot-pill">
                                {formatReturnSlot(request)}
                              </span>
                            </div>
                          </div>

                          <div className="incoming-card-actions">
                            <button
                              type="button"
                              className="accept-btn"
                              disabled={busy}
                              onClick={() =>
                                handleReturnAction(request.id, "confirm_return")
                              }
                            >
                              {busy && processingAction?.action === "confirm_return"
                                ? "Confirming..."
                                : "Accept time"}
                            </button>

                            <button
                              type="button"
                              className="decline-btn"
                              disabled={busy}
                              onClick={() =>
                                handleReturnAction(request.id, "decline_return")
                              }
                            >
                              {busy && processingAction?.action === "decline_return"
                                ? "Declining..."
                                : "Decline"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RequestSection>
              )}

              <RequestSection
                title="Waiting for a reply"
                count={pendingRequests.length + schedulingRequests.length}
              >
                {pendingRequests.length + schedulingRequests.length === 0 ? (
                  <p className="no-pending-text">
                    Nothing waiting right now.
                  </p>
                ) : (
                  <div className="requests-grid">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="incoming-card fx-glow fx-accent-top fx-pop fx-theme-blue">
                        <PersonHeader
                          userId={request.receiver}
                          username={request.receiver_username}
                          ratingAverage={request.receiver_rating_average}
                          ratingCount={request.receiver_rating_count}
                          subtitle="Hasn't responded yet"
                          status={
                            <StatusChip tone="pending">Pending</StatusChip>
                          }
                        />

                        <div className="swap-details">
                          <div className="detail-item">
                            <span className="detail-label">You want to learn</span>
                            <span className="skill-pill pill-learn">
                              {request.skill_name || `Skill #${request.skill}`}
                            </span>
                          </div>

                          <div className="detail-item">
                            <span className="detail-label">Preferred time</span>
                            <span className="slot-pill">
                              {formatSlot(request)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {schedulingRequests.map((request) => (
                      <div key={request.id} className="incoming-card fx-glow fx-accent-top fx-pop fx-theme-amber">
                        <PersonHeader
                          userId={request.receiver}
                          username={request.receiver_username}
                          ratingAverage={request.receiver_rating_average}
                          ratingCount={request.receiver_rating_count}
                          subtitle="Accepted. Choosing a time for your return session."
                          status={
                            <StatusChip tone="pending">Picking a time</StatusChip>
                          }
                        />

                        <div className="swap-details">
                          <div className="detail-item">
                            <span className="detail-label">You teach</span>
                            <span className="skill-pill pill-learn">
                              {request.receiver_skill_name || "Selected skill"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </RequestSection>

              {pastRequests.length > 0 && (
                <RequestSection title="History" count={pastRequests.length}>
                  <div className="requests-grid compact">
                    {(showAllPast
                      ? pastRequests
                      : pastRequests.slice(0, PAST_PREVIEW_COUNT)
                    ).map((request) => (
                      <PastRequestCard
                        key={request.id}
                        request={request}
                        sentByMe
                      />
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

