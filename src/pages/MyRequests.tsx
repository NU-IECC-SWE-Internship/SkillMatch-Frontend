import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  getSentRequests,
  respondToMatchRequest,
  type MatchRequest,
} from "../api/matchingApi";

import { getErrorMessage } from "../lib/api";
import PastRequestCard from "../components/Matching/PastRequestCard";
import UserRatingBadge from "../components/Matching/UserRatingBadge";
import StatusModal from "../components/ui/StatusModal";

import "./Requests.css";

export default function MyRequests() {
  const location = useLocation();
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
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

      <main className="requests-page">
        <div className="requests-container">
          <div className="requests-topbar">
            <Link
              to="/dashboard"
              className="requests-nav-link"
            >
              &larr; Back to Dashboard
            </Link>

            <Link
              to="/skillbrowse"
              className="requests-nav-link"
            >
              Browse Skills &rarr;
            </Link>
          </div>

          <header className="requests-header">
            <h1>My Requests</h1>

            <p>
              Requests you have sent to other users.
            </p>
          </header>

          {errorMessage && (
            <div className="error-banner" role="alert">
              ⚠️ {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="requests-empty">
              <p>Loading your requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="requests-empty">
              <span className="empty-icon">📨</span>

              <h3>No requests yet</h3>

              <p>
                You haven't sent any skill swap requests yet.
              </p>

              <Link
                to="/skillbrowse"
                className="browse-skills-btn"
              >
                Browse Skills
              </Link>
            </div>
          ) : (
            <>
              <section className="requests-group">
                <h2 className="group-title">
                  Waiting for Response ({pendingRequests.length})
                </h2>

                {pendingRequests.length === 0 ? (
                  <p className="no-pending-text">
                    You have no pending requests.
                  </p>
                ) : (
                  <div className="requests-grid">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="incoming-card"
                      >
                        <div className="incoming-card-top">
                          <Link
                            to={`/users/${request.receiver}`}
                            state={{ from: `${location.pathname}${location.search}` }}
                            className="sender-avatar"
                            style={{ textDecoration: "none" }}
                          >
                            {request.receiver_username
                              ? request.receiver_username
                                  .charAt(0)
                                  .toUpperCase()
                              : "?"}
                          </Link>

                          <div>
                            <div className="sender-title-rating">
                              <h3 className="sender-name">
                                Request to{" "}
                                <Link
                                  to={`/users/${request.receiver}`}
                                  state={{ from: `${location.pathname}${location.search}` }}
                                  style={{
                                    textDecoration: "none",
                                    color: "inherit",
                                  }}
                                >
                                  {request.receiver_username}
                                </Link>
                              </h3>

                              <UserRatingBadge
                                ratingAverage={
                                  request.receiver_rating_average
                                }
                                ratingCount={
                                  request.receiver_rating_count
                                }
                              />
                            </div>

                            <span className="skill-pill pill-learn">
                              {request.skill_name ||
                                `Skill #${request.skill}`}
                            </span>
                          </div>
                        </div>

                        <div className="swap-details">
                          <div className="detail-item">
                            <span className="detail-label">
                              Preferred Time Slot
                            </span>

                            <span className="slot-pill">
                              {formatSlot(request)}
                            </span>
                          </div>
                        </div>

                        <div className="status-badge-container">
                          <span className="status-tag status-pending">
                            PENDING
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {schedulingRequests.length > 0 && (
                <section className="requests-group">
                  <h2 className="group-title">
                    Waiting for Return Time (
                    {schedulingRequests.length})
                  </h2>

                  <div className="requests-grid">
                    {schedulingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="incoming-card"
                      >
                        <div className="incoming-card-top">
                          <Link
                            to={`/users/${request.receiver}`}
                            state={{ from: `${location.pathname}${location.search}` }}
                            className="sender-avatar"
                            style={{ textDecoration: "none" }}
                          >
                            {request.receiver_username
                              ? request.receiver_username
                                  .charAt(0)
                                  .toUpperCase()
                              : "?"}
                          </Link>

                          <div>
                            <div className="sender-title-rating">
                              <h3 className="sender-name">
                                Swap with{" "}
                                <Link
                                  to={`/users/${request.receiver}`}
                                  state={{ from: `${location.pathname}${location.search}` }}
                                  style={{
                                    textDecoration: "none",
                                    color: "inherit",
                                  }}
                                >
                                  {request.receiver_username}
                                </Link>
                              </h3>

                              <UserRatingBadge
                                ratingAverage={
                                  request.receiver_rating_average
                                }
                                ratingCount={
                                  request.receiver_rating_count
                                }
                              />
                            </div>

                            <span className="request-tag">
                              Waiting for the other user to choose
                              a return-session time
                            </span>
                          </div>
                        </div>

                        <div className="swap-details">
                          <div className="detail-item">
                            <span className="detail-label">
                              Return Skill
                            </span>

                            <span className="skill-pill pill-learn">
                              {request.receiver_skill_name ||
                                "Selected skill"}
                            </span>
                          </div>
                        </div>

                        <div className="status-badge-container">
                          <span className="status-tag status-pending">
                            SCHEDULING
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {confirmingRequests.length > 0 && (
                <section className="requests-group">
                  <h2 className="group-title">
                    Return Time Needs Your Confirmation (
                    {confirmingRequests.length})
                  </h2>

                  <div className="requests-grid">
                    {confirmingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="incoming-card"
                      >
                        <div className="incoming-card-top">
                          <Link
                            to={`/users/${request.receiver}`}
                            state={{ from: `${location.pathname}${location.search}` }}
                            className="sender-avatar"
                            style={{ textDecoration: "none" }}
                          >
                            {request.receiver_username
                              ? request.receiver_username
                                  .charAt(0)
                                  .toUpperCase()
                              : "?"}
                          </Link>

                          <div>
                            <div className="sender-title-rating">
                              <h3 className="sender-name">
                                {request.receiver_username} proposed
                                a return session
                              </h3>

                              <UserRatingBadge
                                ratingAverage={
                                  request.receiver_rating_average
                                }
                                ratingCount={
                                  request.receiver_rating_count
                                }
                              />
                            </div>

                            <span className="request-tag">
                              Please confirm the proposed time
                            </span>
                          </div>
                        </div>

                        <div className="swap-details">
                          <div className="detail-item">
                            <span className="detail-label">
                              Return Skill
                            </span>

                            <span className="skill-pill pill-learn">
                              {request.receiver_skill_name ||
                                "Selected skill"}
                            </span>
                          </div>

                          <div className="detail-item">
                            <span className="detail-label">
                              Proposed Return Time
                            </span>

                            <span className="slot-pill">
                              {formatReturnSlot(request)}
                            </span>
                          </div>
                        </div>

                        <div className="incoming-card-actions">
                          <button
                            type="button"
                            className="accept-btn"
                            disabled={
                              processingAction?.id === request.id
                            }
                            onClick={() =>
                              handleReturnAction(
                                request.id,
                                "confirm_return"
                              )
                            }
                          >
                            {processingAction?.id === request.id &&
                            processingAction.action ===
                              "confirm_return"
                              ? "Confirming..."
                              : "Accept Return Time"}
                          </button>

                          <button
                            type="button"
                            className="decline-btn"
                            disabled={
                              processingAction?.id === request.id
                            }
                            onClick={() =>
                              handleReturnAction(
                                request.id,
                                "decline_return"
                              )
                            }
                          >
                            {processingAction?.id === request.id &&
                            processingAction.action ===
                              "decline_return"
                              ? "Declining..."
                              : "Decline Return Time"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {pastRequests.length > 0 && (
                <section className="requests-group past-group">
                  <h2 className="group-title">
                    Previous Requests
                  </h2>

                  <div className="requests-grid">
                    {pastRequests.map((request) => (
                      <PastRequestCard
                        key={request.id}
                        request={request}
                        sentByMe
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
