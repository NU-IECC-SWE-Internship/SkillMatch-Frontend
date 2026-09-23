import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMeetings, cancelMeeting, type Meeting } from '../api/meetingsApi';
import RatingModal from '../components/meetings/RatingModal';
import ViewReviewModal from '../components/meetings/ViewReviewModal';
import '../components/meetings/Meetings.css';

type TabType = 'active' | 'upcoming' | 'past';

const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [rateMeeting, setRateMeeting] = useState<Meeting | null>(null);
  const [viewReviewMeeting, setViewReviewMeeting] = useState<Meeting | null>(null);

  const fetchAllMeetings = async (): Promise<void> => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getMeetings('all');
      setMeetings(data);

      // Smart default tab: if active meetings exist, default to 'active'
      const now = Date.now();
      const FIVE_MIN_MS = 5 * 60 * 1000;
      const hasActive = data.some(
        (m) => m.status !== 'CANCELLED' && now >= m.start_time_ts - FIVE_MIN_MS && now <= m.end_time_ts
      );
      if (hasActive) {
        setActiveTab('active');
      }
    } catch (err: unknown) {
      console.error('Failed to load meetings:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Network error while loading meetings.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMeetings();
  }, []);

  const handleCancelMeeting = async (meetingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled meeting session?')) {
      return;
    }
    try {
      setCancellingId(meetingId);
      await cancelMeeting(meetingId);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      setToastMessage('Meeting session has been cancelled.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel meeting.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRatingSuccess = (updatedMeeting: Meeting, message: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m))
    );
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Categorize meetings
  const { activeMeetings, upcomingMeetings, pastMeetings } = useMemo(() => {
    const now = Date.now();
    const FIVE_MIN_MS = 5 * 60 * 1000;

    const active: Meeting[] = [];
    const upcoming: Meeting[] = [];
    const past: Meeting[] = [];

    meetings.forEach((m) => {
      if (m.status === 'CANCELLED') return;

      const isLive = now >= m.start_time_ts - FIVE_MIN_MS && now <= m.end_time_ts;
      const isPast = now > m.end_time_ts || m.status === 'COMPLETED';

      if (isLive) {
        active.push(m);
      } else if (isPast) {
        past.push(m);
      } else {
        upcoming.push(m);
      }
    });

    // Sort active and upcoming by start_time ascending; past by start_time descending (most recent first)
    active.sort((a, b) => a.start_time_ts - b.start_time_ts);
    upcoming.sort((a, b) => a.start_time_ts - b.start_time_ts);
    past.sort((a, b) => b.start_time_ts - a.start_time_ts);

    return { activeMeetings: active, upcomingMeetings: upcoming, pastMeetings: past };
  }, [meetings]);

  const displayedMeetings = useMemo(() => {
    if (activeTab === 'active') return activeMeetings;
    if (activeTab === 'upcoming') return upcomingMeetings;
    return pastMeetings;
  }, [activeTab, activeMeetings, upcomingMeetings, pastMeetings]);

  return (
    <div className="meetings-page">
      <div className="meetings-container">
        {/* Navigation & Header */}
        <div className="meetings-topbar">
          <div>
            <Link to="/dashboard" className="meetings-nav-link">
              &larr; Back to Dashboard
            </Link>
            <h1 className="meetings-title">Approved Skill Swap Sessions</h1>
            <p className="meetings-subtitle">
              Manage your live calls, upcoming scheduled sessions, and exchange reviews.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/profile" className="meetings-nav-link" style={{ alignSelf: 'center' }}>
              My Profile &rarr;
            </Link>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="meetings-toast-alert">
            <span>✨ {toastMessage}</span>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => setToastMessage(null)}
            >
              &times;
            </button>
          </div>
        )}

        {/* 3-Tab Navbar */}
        <div className="meetings-tab-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
            className={`meetings-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            🔴 Active Sessions
            <span className={`tab-count-badge ${activeMeetings.length > 0 ? 'highlight' : ''}`}>
              {activeMeetings.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            className={`meetings-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            📅 Incoming / Upcoming
            <span className="tab-count-badge">
              {upcomingMeetings.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'past'}
            className={`meetings-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            🏁 Past Sessions & Reviews
            <span className="tab-count-badge">
              {pastMeetings.length}
            </span>
          </button>
        </div>

        {/* Meeting List */}
        {loading ? (
          <div className="meetings-empty">
            <p>Loading your skill swap sessions...</p>
          </div>
        ) : errorMessage ? (
          <div className="meetings-empty">
            <div className="empty-icon">⚠️</div>
            <h3>Unable to Load Swaps</h3>
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={fetchAllMeetings}
              className="btn-join"
              style={{ marginTop: '1rem', display: 'inline-block' }}
            >
              Retry
            </button>
          </div>
        ) : displayedMeetings.length === 0 ? (
          <div className="meetings-empty">
            <div className="empty-icon">
              {activeTab === 'active' ? '🎙️' : activeTab === 'upcoming' ? '📅' : '🏁'}
            </div>
            <h3>
              {activeTab === 'active'
                ? 'No Active Sessions Right Now'
                : activeTab === 'upcoming'
                ? 'No Upcoming Sessions'
                : 'No Past Sessions Found'}
            </h3>
            <p>
              {activeTab === 'active'
                ? 'You do not have any ongoing video calls. Check "Incoming / Upcoming" for your scheduled times.'
                : activeTab === 'upcoming'
                ? 'You have no confirmed future meetings. Explore matches to initiate new skill swaps.'
                : 'Completed sessions will appear here where you can leave and view peer reviews.'}
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/matches" className="btn-schedule">
                Find Skill Partners &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="meetings-list">
            {displayedMeetings.map((meeting) => {
              const startDate = new Date(meeting.start_time_ts);
              const partnerName = meeting.partner_name || meeting.participant_b_name || 'Partner';
              const isPastTab = activeTab === 'past';
              const isUpcomingTab = activeTab === 'upcoming';
              const isActiveTab = activeTab === 'active';

              return (
                <div key={meeting.id} className="meeting-card">
                  <div className="meeting-card-info">
                    <div className="partner-avatar">
                      {partnerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="meeting-names">
                        <span>{meeting.participant_a_name}</span>
                        <span className="swap-indicator">↔</span>
                        <span>{meeting.participant_b_name}</span>
                        {meeting.skill_name && (
                          <span className="meeting-skill-pill">
                            🎯 {meeting.skill_name}
                          </span>
                        )}
                      </h3>
                      <div className="meeting-meta">
                        <span>
                          📅 {startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>
                          ⏱️ {Math.round((meeting.end_time_ts - meeting.start_time_ts) / 60000)} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="meeting-card-actions">
                    {/* Active Sessions actions */}
                    {isActiveTab && (
                      <>
                        <span className="badge badge-live">Live Now</span>
                        <Link
                          to={`/meetings/${meeting.id}/room`}
                          state={{ meeting }}
                          className="btn-join pulse"
                        >
                          Join Video Call &rarr;
                        </Link>
                      </>
                    )}

                    {/* Upcoming Sessions actions */}
                    {isUpcomingTab && (
                      <>
                        <span className="badge badge-upcoming">Upcoming</span>
                        <Link
                          to={`/meetings/${meeting.id}/room`}
                          state={{ meeting }}
                          className="btn-join"
                          style={{ background: 'var(--blue-500)' }}
                        >
                          Enter Early &rarr;
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCancelMeeting(meeting.id)}
                          disabled={cancellingId === meeting.id}
                          className="btn-cancel-action"
                        >
                          {cancellingId === meeting.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </>
                    )}

                    {/* Past Sessions actions */}
                    {isPastTab && (
                      <div className="past-meeting-action-cluster">
                        {meeting.has_user_rated ? (
                          <>
                            {meeting.is_revealed ? (
                              <span className="badge badge-revealed">
                                ★ Reviews Revealed
                              </span>
                            ) : (
                              <span className="badge badge-private">
                                🔒 Review Private
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn-review-action view"
                              onClick={() => setViewReviewMeeting(meeting)}
                            >
                              {meeting.is_revealed ? 'View Feedback' : 'Review Status'}
                            </button>
                          </>
                        ) : meeting.can_review ? (
                          <>
                            <span className="badge badge-action-needed">
                              ★ Review Pending
                            </span>
                            <button
                              type="button"
                              className="btn-review-action rate"
                              onClick={() => setRateMeeting(meeting)}
                            >
                              ★ Leave Review
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="badge badge-past">
                              Window Closed
                            </span>
                            <button
                              type="button"
                              className="btn-review-action view"
                              onClick={() => setViewReviewMeeting(meeting)}
                            >
                              View Summary
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rating Submission Modal */}
        <RatingModal
          isOpen={!!rateMeeting}
          meeting={rateMeeting}
          onClose={() => setRateMeeting(null)}
          onSuccess={handleRatingSuccess}
        />

        {/* View Reviews / Blind Status Modal */}
        <ViewReviewModal
          isOpen={!!viewReviewMeeting}
          meeting={viewReviewMeeting}
          onClose={() => setViewReviewMeeting(null)}
          onOpenRateModal={(m) => setRateMeeting(m)}
        />
      </div>
    </div>
  );
};

export default Meetings;

