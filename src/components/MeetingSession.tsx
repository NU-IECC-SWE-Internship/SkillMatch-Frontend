import React, { useState, useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';
import './Meetings.css';

export interface MeetingSessionProps {
  roomUrl: string;
  token: string;
  startTs: number;
  endTs: number;
  onLeave: () => void;
}

const MeetingSession: React.FC<MeetingSessionProps> = ({ 
  roomUrl, 
  token, 
  startTs, 
  endTs, 
  onLeave 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Meeting timing rules (can join 5 minutes early)
  const FIVE_MINUTES = 5 * 60 * 1000;
  const canJoin = now >= (startTs - FIVE_MINUTES);
  const isOver = now > endTs;

  // Cleanly disconnect and return to dashboard
  const handleLeave = () => {
    const call = DailyIframe.getCallInstance();
    if (call) {
      call.leave().catch(() => {});
      call.destroy().catch(() => {});
    }
    onLeave();
  };

  // Initialize the Daily.co video frame
  useEffect(() => {
    if (!containerRef.current || !canJoin || isOver) return;

    // Check if an instance already exists (prevents duplicate errors)
    let call = DailyIframe.getCallInstance();

    if (!call) {
      call = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
        },
      });

      call.join({ url: roomUrl, token });
    }

    // Listen for when the user clicks the "Leave" button inside Daily
    call.on('left-meeting', handleLeave);

    return () => {
      call?.off('left-meeting', handleLeave);
    };
  }, [canJoin, isOver, roomUrl, token]);

  // Case 1: The meeting has ended
  if (isOver) {
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">🏁</div>
          <h2>This session has ended</h2>
          <p>The scheduled time for this skill swap has concluded.</p>
          <button onClick={handleLeave} className="btn-schedule">
            Return to Meetings
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Too early to join (more than 5 minutes before start)
  if (!canJoin) {
    const minutesLeft = Math.max(1, Math.ceil((startTs - FIVE_MINUTES - now) / 60000));
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">⏳</div>
          <h2>You're Early!</h2>
          <p>
            The video swap room opens 5 minutes before scheduled start.<br />
            Room unlocks in <span className="countdown-highlight">{minutesLeft} minute{minutesLeft > 1 ? 's' : ''}</span>.
          </p>
          <button onClick={handleLeave} className="btn-secondary">
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Active video session
  return (
    <div className="meeting-session-page">
      <div className="session-topbar">
        <div className="session-brand-info">
          <h1 className="session-title">SkillMatch Video Swap</h1>
          <span className="session-tag">Live Session</span>
        </div>
        <button onClick={handleLeave} className="btn-leave-call">
          Leave Room
        </button>
      </div>

      <div className="daily-frame-wrapper">
        <div ref={containerRef} className="daily-frame-container" />
      </div>
    </div>
  );
};

export default MeetingSession;