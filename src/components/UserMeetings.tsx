import React, { useState, useEffect } from 'react';
import MeetingSession from './MeetingSession';

export interface Meeting {
  id: number;
  participant_a_name: string;
  participant_b_name: string;
  start_time_ts: number;
  end_time_ts: number;
  room_url: string;
  my_token: string;
}

const UserMeetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async (): Promise<void> => {
    try {
      const res = await fetch('/api/meetings/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data: Meeting[] = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error("Failed to load meetings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (): Promise<void> => {
    try {
      const res = await fetch('/api/meetings/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_b_id: 2, 
          start_iso: new Date().toISOString(),
          duration_minutes: 60
        })
      });
      
      if (res.ok) {
        alert("Meeting scheduled successfully!");
        fetchMeetings(); 
      }
    } catch (err) {
      console.error("Failed to schedule meeting", err);
    }
  };

  if (activeMeeting) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex flex-col">
        <div className="max-w-6xl w-full mx-auto mb-4 flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold">
            Skill Swap: {activeMeeting.participant_a_name} & {activeMeeting.participant_b_name}
          </h1>
          <button 
            onClick={() => setActiveMeeting(null)}
            className="text-gray-400 hover:text-white"
          >
            Exit to Dashboard
          </button>
        </div>
        
        <MeetingSession 
          roomUrl={activeMeeting.room_url}
          token={activeMeeting.my_token}
          startTs={activeMeeting.start_time_ts}
          endTs={activeMeeting.end_time_ts}
          onLeave={() => setActiveMeeting(null)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">All Skill Swaps</h1>
          <button 
            onClick={handleCreateMeeting}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            + Schedule New Swap (POST)
          </button>
        </div>
        
        {loading ? (
          <p className="text-gray-500 text-lg">Loading schedule...</p>
        ) : meetings.length === 0 ? (
          <div className="bg-white p-10 rounded-lg shadow-sm border text-center">
            <p className="text-gray-500 text-lg">No meetings found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="bg-white p-6 rounded-lg shadow-sm border flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {meeting.participant_a_name} ↔ {meeting.participant_b_name}
                  </h3>
                  <p className="text-gray-500 mt-1">
                    {new Date(meeting.start_time_ts).toLocaleString([], {
                      weekday: 'short', month: 'short', day: 'numeric', 
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                <button 
                  onClick={() => setActiveMeeting(meeting)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Join Room
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMeetings;