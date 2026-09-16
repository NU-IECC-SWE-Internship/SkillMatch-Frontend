import React, { useState, useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';
import type { DailyCall, DailyEventObjectFatalError } from '@daily-co/daily-js';
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
  const callFrameRef = useRef<DailyCall | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Allow entering 5 minutes early
  const FIVE_MIN_MS = 5 * 60 * 1000;
  const canJoin = now >= (startTs - FIVE_MIN_MS);
  const isOver = now > endTs;

  useEffect(() => {
    if (!canJoin || isOver || !containerRef.current) return;

    // Prevent duplicate frames (handles React 18/19 StrictMode remounts)
    if (callFrameRef.current) {
      return;
    }

    // Clean container before mounting
    containerRef.current.innerHTML = '';

    const frame: DailyCall = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: { 
        width: '100%', 
        height: '100%', 
        border: 'none',
        borderRadius: '16px',
        backgroundColor: '#0f172a' 
      },
      showLeaveButton: true,
      showFullscreenButton: true,
    });

    callFrameRef.current = frame;

    frame.on('left-meeting', () => {
      onLeave();
    });

    frame.on('error', (event?: DailyEventObjectFatalError) => {
      console.error('Daily Call Error:', event);
      setCallError(event?.errorMsg || 'A connection error occurred with the video room.');
    });

    frame.join({ url: roomUrl, token: token }).catch((err) => {
      console.error('Failed to join Daily room:', err);
      setCallError(err?.message || 'Failed to enter the video room. Please check your connection.');
    });

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave().catch(() => {});
        callFrameRef.current.destroy().catch(() => {});
        callFrameRef.current = null;
      }
    };
  }, [canJoin, isOver, roomUrl, token, onLeave]);

  if (isOver) {
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">🏁</div>
          <h2>This session has ended</h2>
          <p>The scheduled time for this skill swap meeting has concluded.</p>
          <button onClick={onLeave} className="btn-schedule">
            Return to Meetings
          </button>
        </div>
      </div>
    );
  }

  if (!canJoin) {
    const minutesLeft = Math.max(1, Math.ceil(((startTs - FIVE_MIN_MS) - now) / 60000));
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">⏳</div>
          <h2>You're Early!</h2>
          <p>
            The video swap room opens 5 minutes before scheduled start.<br />
            Room unlocks in <span className="countdown-highlight">{minutesLeft} minute{minutesLeft > 1 ? 's' : ''}</span>.
          </p>
          <button onClick={onLeave} className="btn-secondary">
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
        <button onClick={onLeave} className="btn-leave-call">
          Leave Room
        </button>
      </div>

      {callError && (
        <div className="modal-error" style={{ maxWidth: '1200px', margin: '0 auto 1rem', width: '100%' }}>
          {callError}
        </div>
      )}

      <div className="daily-frame-wrapper">
        <div ref={containerRef} className="daily-frame-container" />
      </div>
    </div>
  );
};

export default MeetingSession;