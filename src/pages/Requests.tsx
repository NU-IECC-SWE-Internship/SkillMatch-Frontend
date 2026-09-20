import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getIncomingRequests,
  respondToMatchRequest,
  type IncomingRequestItem,
} from "../api/matchingApi";
import { getErrorMessage } from "../lib/api";
import "./Requests.css";

export default function IncomingRequests() {
  const [requests, setRequests] = useState<IncomingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getIncomingRequests();
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

  const handleAction = async (requestId: number, action: "accept" | "reject") => {
    try {
      setProcessingId(requestId);
      await respondToMatchRequest(requestId, action);
      
      // Update local state to reflect accepted/rejected status immediately
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: action === "accept" ? "ACCEPTED" : "REJECTED" }
            : req
        )
      );
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setProcessingId(null);
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
    const day =
      request.selected_slot_day.charAt(0).toUpperCase() +
      request.selected_slot_day.slice(1);
    return `${day}, ${formatTime(request.selected_slot_start_time)} – ${formatTime(request.selected_slot_end_time)}`;
  };

  return (
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

        {errorMessage && (
          <div className="error-banner" role="alert">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="requests-empty">
            <p>Loading incoming requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="requests-empty">
            <h3>No requests yet</h3>
            <p>When another user requests a skill swap with you, it will appear here.</p>
            <Link to="/matches" className="browse-matches-btn">
              Browse Matches
            </Link>
          </div>
        ) : (
          <>
            {/* Pending Requests Section */}
            <section className="requests-group">
              <h2 className="group-title">
                Needs Your Response ({pendingRequests.length})
              </h2>

              {pendingRequests.length === 0 ? (
                <p className="no-pending-text">All caught up! No pending requests.</p>
              ) : (
                <div className="requests-grid">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="incoming-card">
                      <div className="incoming-card-top">
                        <div className="sender-avatar">
                          {req.sender_username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="sender-name">{req.sender_username}</h3>
                          <span className="request-tag">Wants to learn from you</span>
                        </div>
                      </div>

                      <div className="swap-details">
                        <div className="detail-item">
                          <span className="detail-label">Requested Skill</span>
                          <span className="skill-pill pill-learn">
                            {req.skill_name || `Skill #${req.skill}`}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Preferred Time Slot</span>
                          <span className="slot-pill">{formatSlot(req)}</span>
                        </div>
                      </div>

                      <div className="incoming-card-actions">
                        <button
                          type="button"
                          className="accept-btn"
                          disabled={processingId === req.id}
                          onClick={() => handleAction(req.id, "accept")}
                        >
                          {processingId === req.id ? "Accepting..." : "Accept Swap"}
                        </button>
                        <button
                          type="button"
                          className="decline-btn"
                          disabled={processingId === req.id}
                          onClick={() => handleAction(req.id, "reject")}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Completed/History Section */}
            {pastRequests.length > 0 && (
              <section className="requests-group past-group">
                <h2 className="group-title">Previous Requests</h2>
                <div className="requests-grid">
                  {pastRequests.map((req) => (
                    <div key={req.id} className="incoming-card past-card">
                      <div className="incoming-card-top">
                        <div className="sender-avatar muted">
                          {req.sender_username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="sender-name">{req.sender_username}</h3>
                          <span className="skill-pill pill-learn">
                            {req.skill_name || `Skill #${req.skill}`}
                          </span>
                        </div>
                      </div>

                      <div className="status-badge-container">
                        <span className={`status-tag status-${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
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