import React, { useState, useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';
import type { DailyCall } from '@daily-co/daily-js';
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
  const [callJoined, setCallJoined] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const FIVE_MIN_MS = 5 * 60 * 1000;
  const canJoin = now >= (startTs - FIVE_MIN_MS);
  const isOver = now > endTs;

  useEffect(() => {
    if (!canJoin || isOver || !containerRef.current || callJoined) return;

    const callFrame: DailyCall = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: { 
        width: '100%', 
        height: '100%', 
        border: 'none',
        borderRadius: '12px',
        backgroundColor: '#1f2937' 
      },
      showLeaveButton: true,
      showFullscreenButton: true,
    });

    callFrame.on('left-meeting', () => {
      onLeave();
    });

    callFrame.join({ url: roomUrl, token: token });
    setCallJoined(true);

    return () => {
      callFrame.leave();
      callFrame.destroy();
    };
  }, [canJoin, isOver, roomUrl, token, onLeave, callJoined]);

  if (isOver) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-gray-900 rounded-xl text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-4">This session has ended.</h2>
        <button onClick={onLeave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!canJoin) {
    const minutesLeft = Math.ceil(((startTs - FIVE_MIN_MS) - now) / 60000);
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-gray-900 rounded-xl text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">You're Early!</h2>
        <p className="text-gray-400 text-lg">
          The skill swap room will unlock in <span className="font-bold text-blue-400">{minutesLeft} minutes</span>.
        </p>
        <button onClick={onLeave} className="mt-8 text-gray-500 hover:text-gray-300 underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto h-[80vh] bg-gray-900 rounded-xl shadow-2xl p-1">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default MeetingSession;