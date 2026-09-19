import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MeetingSession from '../components/meetings/MeetingSession';
import { getMeetings, type Meeting } from '../api/meetingsApi';
import '../components/meetings/Meetings.css';

const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAcceptedMeetings = async (): Promise<void> => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getMeetings('accepted');
      setMeetings(data);
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
    fetchAcceptedMeetings();
  }, []);

  const getMeetingStatus = (startTs: number, endTs: number): 'live' | 'upcoming' | 'ended' => {
    const now = Date.now();
    const FIVE_MIN_MS = 5 * 60 * 1000;
    if (now > endTs) return 'ended';
    if (now >= startTs - FIVE_MIN_MS) return 'live';
    return 'upcoming';
  };

  if (activeMeeting && activeMeeting.room_url && activeMeeting.my_token) {
    return (
      <MeetingSession
        roomUrl={activeMeeting.room_url}
        token={activeMeeting.my_token}
        startTs={activeMeeting.start_time_ts}
        endTs={activeMeeting.end_time_ts}
        onLeave={() => setActiveMeeting(null)}
      />
    );
  }

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
            <p className="meetings-subtitle">Your confirmed and accepted 1-on-1 video exchange sessions.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/profile" className="meetings-nav-link" style={{ alignSelf: 'center' }}>
              My Profile &rarr;
            </Link>
          </div>
        </div>

        {/* Meeting List */}
        {loading ? (
          <div className="meetings-empty">
            <p>Loading your approved swaps...</p>
          </div>
        ) : errorMessage ? (
          <div className="meetings-empty">
            <div className="empty-icon">⚠️</div>
            <h3>Unable to Load Swaps</h3>
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={fetchAcceptedMeetings}
              className="btn-join"
              style={{ marginTop: '1rem', display: 'inline-block' }}
            >
              Retry
            </button>
          </div>
        ) : meetings.length === 0 ? (
          <div className="meetings-empty">
            <div className="empty-icon">🤝</div>
            <h3>No Approved Swaps Found</h3>
            <p>
              You have no confirmed skill swap meetings at this time. Once a swap request is accepted, it will appear here ready to join.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/dashboard" className="meetings-nav-link">
                &larr; Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="meetings-list">
            {meetings.map((meeting) => {
              const status = getMeetingStatus(meeting.start_time_ts, meeting.end_time_ts);
              const startDate = new Date(meeting.start_time_ts);
              const partnerName = meeting.partner_name || meeting.participant_b_name || 'Partner';

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
                    {status === 'live' && (
                      <span className="badge badge-live">Live Now</span>
                    )}
                    {status === 'upcoming' && (
                      <span className="badge badge-upcoming">Upcoming</span>
                    )}
                    {status === 'ended' && (
                      <span className="badge badge-past">Ended</span>
                    )}

                    {status === 'live' ? (
                      <button
                        type="button"
                        onClick={() => setActiveMeeting(meeting)}
                        className="btn-join"
                      >
                        Join Room &rarr;
                      </button>
                    ) : status === 'upcoming' ? (
                      <button
                        type="button"
                        onClick={() => setActiveMeeting(meeting)}
                        className="btn-join"
                        style={{ background: 'var(--blue-500)' }}
                      >
                        Enter Early &rarr;
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="btn-join disabled"
                      >
                        Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Meetings;
