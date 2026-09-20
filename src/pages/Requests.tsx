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
import "./Requests.css";

export default function Requests() {
  const [requests, setRequests] = useState<IncomingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<{
    id: number;
    action: "accept" | "reject";
  } | null>(null);  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleAction = async (
    requestId: number,
    action: "accept" | "reject",
    rejectionReason?: string
  ) => {
    try {
      setProcessingAction({
        id: requestId,
        action,
      });
      setErrorMessage(null);
      setSuccessMessage(null);

      await respondToMatchRequest(
        requestId,
        action,
        rejectionReason
      );

      if (action === "accept") {
        setSuccessMessage("Swap accepted! Meeting scheduled successfully. You can join it in the Meetings tab.");
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status:
                  action === "accept"
                    ? "ACCEPTED"
                    : "REJECTED",
                rejection_reason:
                  action === "reject"
                    ? rejectionReason || null
                    : null,
              }
            : req
        )
      );
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
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

        {successMessage && (
          <div className="success-banner" role="status">
            <span>✅ {successMessage}</span>
            <Link to="/meetings" className="view-meeting-link">
              Go to Meetings &rarr;
            </Link>
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
            {/* Pending Requests */}
            <section className="requests-group">
              <h2 className="group-title">
                Needs Your Response ({pendingRequests.length})
              </h2>

              {pendingRequests.length === 0 ? (
                <p className="no-pending-text">All caught up! No pending requests.</p>
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

            {/* Past Requests */}
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
  );
}