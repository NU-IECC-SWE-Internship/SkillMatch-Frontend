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

const MeetingSession: React.FC<MeetingSessionProps> = ({ roomUrl, token, startTs, endTs, onLeave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const FIVE_MINUTES = 5 * 60 * 1000;
  const canJoin = now >= (startTs - FIVE_MINUTES);
  const isOver = now > endTs;

  const handleLeave = () => {
    const call = DailyIframe.getCallInstance();
    if (call) {
      call.leave().catch(() => {});
      call.destroy().catch(() => {});
    }
    onLeave();
  };

  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canJoin || isOver) return;

    let call = DailyIframe.getCallInstance();

    if (!call) {
      try {
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
      } catch (err: unknown) {
        console.error('Daily initialization error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('WebRTC') || !window.isSecureContext) {
          setCallError('WebRTC is suppressed by your browser because this page is served over plain HTTP. WebRTC and camera access require a secure connection (HTTPS or localhost).');
        } else {
          setCallError(msg);
        }
        return;
      }
    }

    call.on('left-meeting', handleLeave);

    return () => {
      call?.off('left-meeting', handleLeave);
      if (call) {
        call.leave().catch(() => { });
        call.destroy().catch(() => { });
      }
    };
  }, [canJoin, isOver, roomUrl, token]);

  if (callError) {
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">⚠️</div>
          <h2>Video Setup Required</h2>
          <p>{callError}</p>
          <button onClick={handleLeave} className="btn-schedule">
            Return to Meetings
          </button>
        </div>
      </div>
    );
  }

  if (!roomUrl || !token) {
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">⚠️</div>
          <h2>Meeting Credentials Missing</h2>
          <p>This meeting does not have active video room credentials. Please ensure the meeting has been accepted.</p>
          <button onClick={onLeave} className="btn-schedule">
            Return to Meetings
          </button>
        </div>
      </div>
    );
  }

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