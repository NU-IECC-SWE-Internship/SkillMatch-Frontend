import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MeetingSession from './MeetingSession';
import { getAccessToken, refreshAccessToken, clearTokens } from '../lib/auth';
import './Meetings.css';

export interface Meeting {
  id: number;
  participant_a_name: string;
  participant_b_name: string;
  partner_name?: string;
  start_time_ts: number;
  end_time_ts: number;
  room_url: string;
  my_token: string | null;
}

const UserMeetings: React.FC = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getAuthToken = (): string => {
    return getAccessToken() || localStorage.getItem('access_token') || '';
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async (): Promise<void> => {
    try {
      let token = getAuthToken();
      let res = await fetch('/api/meetings/', {
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        }
      });

      // If unauthorized, attempt to refresh token and retry
      if (res.status === 401) {
        try {
          token = await refreshAccessToken();
          res = await fetch('/api/meetings/', {
            headers: {
              'Authorization': `Bearer ${token}`, 
              'Content-Type': 'application/json'
            }
          });
        } catch {
          clearTokens();
          navigate('/login');
          return;
        }
      }

      if (res.ok) {
        const data: Meeting[] = await res.json();
        setMeetings(data);
      } else if (res.status === 401) {
        clearTokens();
        navigate('/login');
      } else {
        setErrorMessage('Failed to load meetings.');
      }
    } catch (err) {
      console.error('Failed to load meetings', err);
      setErrorMessage('Network error while loading meetings.');
    } finally {
      setLoading(false);
    }
  };

  const getMeetingStatus = (startTs: number, endTs: number): 'live' | 'upcoming' | 'ended' => {
    const now = Date.now();
    const FIVE_MIN_MS = 5 * 60 * 1000;
    if (now > endTs) return 'ended';
    if (now >= startTs - FIVE_MIN_MS) return 'live';
    return 'upcoming';
  };

  if (activeMeeting && activeMeeting.my_token) {
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
            <Link to="/" className="meetings-nav-link">
              &larr; Back to Dashboard
            </Link>
            <h1 className="meetings-title">Skill Swap Sessions</h1>
            <p className="meetings-subtitle">Your scheduled 1-on-1 video exchange sessions.</p>
          </div>
        </div>

        {/* Meeting List */}
        {loading ? (
          <div className="meetings-empty">
            <p>Loading your scheduled swaps...</p>
          </div>
        ) : errorMessage ? (
          <div className="meetings-empty">
            <div className="empty-icon">⚠️</div>
            <h3>Unable to Load Swaps</h3>
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setErrorMessage(null);
                fetchMeetings();
              }}
              className="btn-join"
              style={{ marginTop: '1rem', display: 'inline-block' }}
            >
              Retry
            </button>
          </div>
        ) : meetings.length === 0 ? (
          <div className="meetings-empty">
            <div className="empty-icon">🤝</div>
            <h3>No Scheduled Swaps Found</h3>
            <p>You have no scheduled skill swap meetings at this time. Once a swap is arranged, it will appear here.</p>
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

export default UserMeetings;