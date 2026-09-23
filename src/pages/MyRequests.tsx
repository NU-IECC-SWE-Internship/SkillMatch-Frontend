import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getSentRequests,
  type MatchRequest,
} from "../api/matchingApi";

import { getErrorMessage } from "../lib/api";
import PastRequestCard from "../components/Matching/PastRequestCard";
import UserRatingBadge from "../components/Matching/UserRatingBadge";

import "./Requests.css";

export default function MyRequests() {
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING"
  );

  const pastRequests = requests.filter(
    (request) => request.status !== "PENDING"
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

  return (
    <main className="requests-page">
      <div className="requests-container">

        {/* Top navigation */}
        <div className="requests-topbar">
          <Link
            to="/dashboard"
            className="requests-nav-link"
          >
            &larr; Back to Dashboard
          </Link>

          <Link
            to="/matches"
            className="requests-nav-link"
          >
            Find Matches &rarr;
          </Link>
        </div>

        {/* Header */}
        <header className="requests-header">
          <h1>My Requests</h1>

          <p>
            Requests you have sent to other users.
          </p>
        </header>

        {/* Error */}
        {errorMessage && (
          <div className="error-banner" role="alert">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="requests-empty">
            <p>Loading your requests...</p>
          </div>
        ) : requests.length === 0 ? (
          /* No requests */
          <div className="requests-empty">
            <span className="empty-icon">📨</span>

            <h3>No requests yet</h3>

            <p>
              You haven't sent any skill swap requests yet.
            </p>

            <Link
              to="/matches"
              className="browse-matches-btn"
            >
              Browse Matches
            </Link>
          </div>
        ) : (
          <>
            {/* Pending requests */}
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
                        <div className="sender-avatar">
                          {request.receiver_username
                            ? request.receiver_username
                                .charAt(0)
                                .toUpperCase()
                            : "?"}
                        </div>

                        <div>
                          <div className="sender-title-rating">
                            <h3 className="sender-name">
                              Request to{" "}
                              {request.receiver_username}
                            </h3>
                            <UserRatingBadge
                              ratingAverage={request.receiver_rating_average}
                              ratingCount={request.receiver_rating_count}
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

            {/* Accepted / Rejected */}
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
  );
}