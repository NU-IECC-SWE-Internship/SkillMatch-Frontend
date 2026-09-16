import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MeetingSession from './MeetingSession';
import { getAccessToken } from '../lib/auth';
import './Meetings.css';

export interface Meeting {
  id: number;
  participant_a_name: string;
  participant_b_name: string;
  start_time_ts: number;
  end_time_ts: number;
  room_url: string;
  my_token: string | null;
}

export interface AvailablePartner {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

const UserMeetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [partners, setPartners] = useState<AvailablePartner[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
  const [startTimeInput, setStartTimeInput] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const getAuthToken = (): string => {
    return getAccessToken() || localStorage.getItem('access_token') || '';
  };

  useEffect(() => {
    fetchMeetings();
    fetchPartners();

    // Default start time to now + 5 minutes rounded
    const defaultDate = new Date(Date.now() + 5 * 60 * 1000);
    defaultDate.setSeconds(0, 0);
    // Format YYYY-MM-DDTHH:mm for datetime-local input
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}T${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;
    setStartTimeInput(localIso);
  }, []);

  const fetchMeetings = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/meetings/', {
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data: Meeting[] = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error('Failed to load meetings', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/meetings/users/', {
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data: AvailablePartner[] = await res.json();
        setPartners(data);
        if (data.length > 0 && selectedPartnerId === '') {
          setSelectedPartnerId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load available partners', err);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);

    if (!selectedPartnerId) {
      setFormError('Please select a swap partner.');
      return;
    }

    if (!startTimeInput) {
      setFormError('Please choose a start date and time.');
      return;
    }

    setFormSubmitting(true);
    try {
      const token = getAuthToken();
      const startDate = new Date(startTimeInput);

      const res = await fetch('/api/meetings/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_b_id: Number(selectedPartnerId), 
          start_iso: startDate.toISOString(),
          duration_minutes: Number(durationMinutes)
        })
      });

      const responseData = await res.json().catch(() => null);

      if (res.ok) {
        setIsModalOpen(false);
        fetchMeetings();
      } else {
        const message = responseData?.error || responseData?.detail || 'Failed to schedule meeting. Please try again.';
        setFormError(message);
      }
    } catch (err) {
      console.error('Failed to schedule meeting', err);
      setFormError('Network error while scheduling meeting. Please check the backend connection.');
    } finally {
      setFormSubmitting(false);
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
            <p className="meetings-subtitle">Connect, practice, and learn together via 1-on-1 video rooms.</p>
          </div>
          <button 
            type="button"
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="btn-schedule"
          >
            + Schedule New Swap
          </button>
        </div>

        {/* Meeting List */}
        {loading ? (
          <div className="meetings-empty">
            <p>Loading your scheduled swaps...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="meetings-empty">
            <div className="empty-icon">🤝</div>
            <h3>No Scheduled Swaps Yet</h3>
            <p>Ready to level up your skills? Schedule your first video exchange session with a community partner.</p>
            <button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-schedule"
            >
              + Schedule First Swap
            </button>
          </div>
        ) : (
          <div className="meetings-list">
            {meetings.map((meeting) => {
              const status = getMeetingStatus(meeting.start_time_ts, meeting.end_time_ts);
              const startDate = new Date(meeting.start_time_ts);
              const partnerName = meeting.participant_b_name;

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

      {/* Schedule Meeting Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Skill Swap</h2>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="modal-close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateMeeting}>
              <div className="modal-body">
                {formError && (
                  <div className="modal-error">
                    {formError}
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="partner-select">Select Partner</label>
                  {partners.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                      No other registered users found to swap with.
                    </p>
                  ) : (
                    <select 
                      id="partner-select"
                      value={selectedPartnerId}
                      onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                      required
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.username} {p.first_name ? `(${p.first_name} ${p.last_name || ''})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="start-time-input">Start Date & Time</label>
                  <input 
                    id="start-time-input"
                    type="datetime-local" 
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="duration-select">Session Duration</label>
                  <select 
                    id="duration-select"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  >
                    <option value={15}>15 minutes (Quick Catchup)</option>
                    <option value={30}>30 minutes (Standard Swap)</option>
                    <option value={45}>45 minutes (Deep Dive)</option>
                    <option value={60}>60 minutes (Comprehensive Session)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-schedule"
                  disabled={formSubmitting || partners.length === 0}
                >
                  {formSubmitting ? 'Creating Room...' : 'Schedule Swap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMeetings;