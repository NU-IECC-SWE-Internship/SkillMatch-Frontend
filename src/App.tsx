import React from 'react';
import UserMeetings from './components/UserMeetings';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Optional: Add a global navigation bar or header here if your team wants one */}
      <header className="bg-gray-900 border-b border-gray-800 py-4 px-8">
        <h1 className="text-xl font-bold tracking-wide text-blue-400">
          SkillSwap Platform
        </h1>
      </header>

      {/* Main App View */}
      <main>
        <UserMeetings />
      </main>
    </div>
  );
};

export default App;