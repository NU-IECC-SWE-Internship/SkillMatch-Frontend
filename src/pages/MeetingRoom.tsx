import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import MeetingSession from '../components/meetings/MeetingSession';
import { getMeetingDetail, type Meeting } from '../api/meetingsApi';
import '../components/meetings/Meetings.css';

const MeetingRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateMeeting = (location.state as { meeting?: Meeting } | null)?.meeting;
  const [meeting, setMeeting] = useState<Meeting | null>(
    stateMeeting && String(stateMeeting.id) === id ? stateMeeting : null
  );
  const [loading, setLoading] = useState<boolean>(!meeting);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setError('Invalid meeting ID.');
      setLoading(false);
      return;
    }

    // If meeting is already loaded from router state for this ID, no need to re-fetch
    if (meeting && String(meeting.id) === id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getMeetingDetail(Number(id))
      .then((data) => {
        if (isMounted) {
          setMeeting(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load meeting details.'
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">⏳</div>
          <h2>Connecting to Session...</h2>
          <p>Retrieving your meeting room credentials and security token.</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">⚠️</div>
          <h2>Unable to Join Meeting</h2>
          <p>{error || 'Meeting not found or you do not have permission to join.'}</p>
          <button onClick={() => navigate('/meetings')} className="btn-schedule">
            Return to Meetings
          </button>
        </div>
      </div>
    );
  }

  if (!meeting.room_url || !meeting.my_token) {
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">⚠️</div>
          <h2>Meeting Credentials Missing</h2>
          <p>This meeting does not have active video room credentials. Please ensure the meeting has been accepted.</p>
          <button onClick={() => navigate('/meetings')} className="btn-schedule">
            Return to Meetings
          </button>
        </div>
      </div>
    );
  }

  return (
    <MeetingSession
      roomUrl={meeting.room_url}
      token={meeting.my_token}
      startTs={meeting.start_time_ts}
      endTs={meeting.end_time_ts}
      onLeave={() => navigate('/meetings')}
    />
  );
};

export default MeetingRoom;
