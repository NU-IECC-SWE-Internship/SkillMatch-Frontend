import React, { useState, useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';
import './Meetings.css';

export interface MeetingSessionProps {
  roomUrl: string;
  token: string;
  startTs: number;
  endTs: number;
  partnerName?: string;
  meetingStatus?: string;
  onLeaveTemporarily?: () => void;
  onEndCall?: () => void;
  onLeave?: () => void;
}

const MeetingSession: React.FC<MeetingSessionProps> = ({
  roomUrl,
  token,
  startTs,
  endTs,
  partnerName,
  meetingStatus,
  onLeaveTemporarily,
  onEndCall,
  onLeave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<number>(Date.now());
  const displayName = partnerName || 'Your partner';
  const [partnerNotice, setPartnerNotice] = useState<{
    type: 'temporary_leave' | 'ended_call' | 'rejoined';
    message: string;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (meetingStatus === 'COMPLETED') {
      setPartnerNotice({
        type: 'ended_call',
        message: `${displayName} has ended the call.`,
      });
    }
  }, [meetingStatus, displayName]);

  const FIVE_MINUTES = 5 * 60 * 1000;
  const canJoin = now >= (startTs - FIVE_MINUTES);
  const isOver = now > endTs;

  const handleLeaveTemporarily = () => {
    const call = DailyIframe.getCallInstance();
    if (call) {
      try {
        call.sendAppMessage({ type: 'PARTNER_LEFT_TEMPORARILY' }, '*');
      } catch (err) {
        console.warn('sendAppMessage error:', err);
      }
    }
    setTimeout(() => {
      if (call) {
        call.leave().catch(() => {});
        call.destroy().catch(() => {});
      }
      if (onLeaveTemporarily) {
        onLeaveTemporarily();
      } else if (onLeave) {
        onLeave();
      }
    }, 150);
  };

  const handleEndCall = () => {
    const call = DailyIframe.getCallInstance();
    if (call) {
      try {
        call.sendAppMessage({ type: 'PARTNER_ENDED_CALL' }, '*');
      } catch (err) {
        console.warn('sendAppMessage error:', err);
      }
    }
    setTimeout(() => {
      if (call) {
        call.leave().catch(() => {});
        call.destroy().catch(() => {});
      }
      if (onEndCall) {
        onEndCall();
      } else if (onLeave) {
        onLeave();
      }
    }, 150);
  };

  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canJoin || isOver) return;

    let call = DailyIframe.getCallInstance();

    if (!call) {
      try {
        call = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: false,
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

    const handleAppMessage = (ev: { data?: { type?: string; username?: string } }) => {
      const data = ev?.data;
      if (!data || !data.type) return;

      if (data.type === 'PARTNER_LEFT_TEMPORARILY') {
        setPartnerNotice({
          type: 'temporary_leave',
          message: `${displayName} stepped out temporarily. They can rejoin anytime.`,
        });
      } else if (data.type === 'PARTNER_ENDED_CALL') {
        setPartnerNotice({
          type: 'ended_call',
          message: `${displayName} has ended the call.`,
        });
      }
    };

    const handleParticipantLeft = () => {
      setPartnerNotice((prev) => {
        if (prev?.type === 'ended_call') return prev;
        return {
          type: 'temporary_leave',
          message: `${displayName} disconnected or stepped out. Waiting for them to rejoin...`,
        };
      });
    };

    const handleParticipantJoined = (ev: { participant?: { local?: boolean } }) => {
      if (!ev?.participant?.local) {
        setPartnerNotice({
          type: 'rejoined',
          message: `${displayName} has joined the call!`,
        });
        setTimeout(() => {
          setPartnerNotice((current) => current?.type === 'rejoined' ? null : current);
        }, 5000);
      }
    };

    call.on('app-message', handleAppMessage);
    call.on('participant-left', handleParticipantLeft);
    call.on('participant-joined', handleParticipantJoined);
    call.on('left-meeting', handleEndCall);

    return () => {
      call?.off('app-message', handleAppMessage);
      call?.off('participant-left', handleParticipantLeft);
      call?.off('participant-joined', handleParticipantJoined);
      call?.off('left-meeting', handleEndCall);
      if (call) {
        call.leave().catch(() => { });
        call.destroy().catch(() => { });
      }
    };
  }, [canJoin, isOver, roomUrl, token, displayName]);

  if (callError) {
    return (
      <div className="meeting-session-page">
        <div className="session-status-card">
          <div className="session-status-icon">⚠️</div>
          <h2>Video Setup Required</h2>
          <p>{callError}</p>
          <button onClick={handleLeaveTemporarily} className="btn-schedule">
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
          <button onClick={handleLeaveTemporarily} className="btn-schedule">
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
          <button onClick={handleEndCall} className="btn-schedule">
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
          <button onClick={handleLeaveTemporarily} className="btn-secondary">
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
        <div className="session-actions">
          <button
            type="button"
            onClick={handleLeaveTemporarily}
            className="btn-leave-temporary"
            title="Step out of the meeting without ending it. You can rejoin anytime."
          >
            Leave Temporarily
          </button>
          <button
            type="button"
            onClick={handleEndCall}
            className="btn-end-call"
            title="Finish the meeting session and submit your review."
          >
            End Call
          </button>
        </div>
      </div>

      {partnerNotice && (
        <div className={`session-notice-banner ${partnerNotice.type}`}>
          <div className="notice-content">
            <span className="notice-icon">
              {partnerNotice.type === 'ended_call' ? '🛑' : partnerNotice.type === 'rejoined' ? '👋' : '⏳'}
            </span>
            <span className="notice-text">{partnerNotice.message}</span>
          </div>
          {partnerNotice.type === 'ended_call' ? (
            <button
              type="button"
              onClick={handleEndCall}
              className="btn-notice-action"
            >
              End Call & Rate
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPartnerNotice(null)}
              className="notice-dismiss-btn"
              aria-label="Dismiss notice"
            >
              &times;
            </button>
          )}
        </div>
      )}

      <div className="daily-frame-wrapper">
        <div ref={containerRef} className="daily-frame-container" />
      </div>
    </div>
  );
};

export default MeetingSession;