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

function formatDailyError(msg: string | undefined): string {
  if (msg === 'account-missing-payment-method') {
    return 'The Daily.co account has exceeded its free allowance or requires a payment method on file to join rooms. Please add a payment method in dashboard.daily.co or update the DAILY_API_KEY in the backend.';
  }
  if (msg === 'meeting-full') {
    return 'This skill swap room is currently full.';
  }
  if (msg === 'not-allowed') {
    return 'Access to this video room was denied. The session token may be invalid or expired.';
  }
  return msg || 'Failed to connect to the video swap room.';
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
  const isMountedRef = useRef<boolean>(true);
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

  const handleLeaveClick = async () => {
    isMountedRef.current = false;
    const frame = DailyIframe.getCallInstance();
    if (frame) {
      try {
        await frame.leave();
        await frame.destroy();
      } catch (err) {
        console.warn('Error leaving/destroying Daily frame:', err);
      }
    }
    callFrameRef.current = null;
    onLeave();
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (!canJoin || isOver || !containerRef.current) return;

    // Check if a Daily instance already exists (e.g. from previous tick or StrictMode mount)
    let frame: DailyCall | undefined = DailyIframe.getCallInstance();

    if (!frame) {
      try {
        frame = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: { 
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%', 
            height: '100%', 
            border: 'none',
            backgroundColor: '#0f172a' 
          },
          showLeaveButton: true,
          showFullscreenButton: true,
        });
      } catch (err: unknown) {
        console.warn('createFrame warning, checking existing instance:', err);
        frame = DailyIframe.getCallInstance();
      }
    }

    if (!frame) return;
    callFrameRef.current = frame;

    // Ensure the iframe element is inside the current DOM container and sized full bleed
    try {
      // DailyCall runtime object has an iframe() accessor
      const iframe = (frame as unknown as { iframe?: () => HTMLIFrameElement }).iframe?.();
      if (iframe) {
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.display = 'block';

        if (containerRef.current && !containerRef.current.contains(iframe)) {
          containerRef.current.appendChild(iframe);
        }
      }
    } catch (e) {
      console.warn('Error attaching Daily iframe to container:', e);
    }

    // Set up event listeners
    frame.on('left-meeting', () => {
      handleLeaveClick();
    });

    frame.on('error', (event?: DailyEventObjectFatalError) => {
      console.error('Daily Call Error:', event);
      setCallError(formatDailyError(event?.errorMsg));
    });

    // Only join if not already joined or joining
    const state = frame.meetingState();
    if (state !== 'joined-meeting' && state !== 'joining-meeting') {
      frame.join({ url: roomUrl, token: token }).catch((err) => {
        console.error('Failed to join Daily room:', err);
        setCallError(formatDailyError(err?.errorMsg || err?.message));
      });
    }

    return () => {
      isMountedRef.current = false;
      // Delay destruction to survive React 18/19 StrictMode double-mount without Duplicate DailyIframe errors
      setTimeout(() => {
        if (!isMountedRef.current) {
          const currentFrame = DailyIframe.getCallInstance();
          if (currentFrame) {
            currentFrame.leave().catch(() => {});
            currentFrame.destroy().catch(() => {});
            callFrameRef.current = null;
          }
        }
      }, 150);
    };
  }, [canJoin, isOver, roomUrl, token]);

  if (callError) {
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">⚠️</div>
          <h2>Video Room Notice</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
            {callError}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleLeaveClick} className="btn-schedule">
              Return to Meetings
            </button>
            <a 
              href="https://dashboard.daily.co/billing" 
              target="_blank" 
              rel="noreferrer" 
              className="btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Daily.co Billing &rarr;
            </a>
          </div>
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
          <p>The scheduled time for this skill swap meeting has concluded.</p>
          <button onClick={handleLeaveClick} className="btn-schedule">
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
          <button onClick={handleLeaveClick} className="btn-secondary">
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
        <button onClick={handleLeaveClick} className="btn-leave-call">
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