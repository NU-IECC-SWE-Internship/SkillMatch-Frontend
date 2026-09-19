import { Navigate, Route, Routes } from 'react-router-dom'
// import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Matches from "./pages/Matches";
import SendRequest from "./pages/SendRequest";
import Profile from "./pages/Profile";
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import MeetingRoom from './pages/MeetingRoom';
import Requests from "./pages/Requests";
import { isAuthenticated } from './lib/auth'



// function ProtectedHome() {
//   if (!isAuthenticated()) {
//     return <Navigate to="/login" replace />;
//   }

//   return <Home />;
// }




function ProtectedProfile() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Profile />;
}

function ProtectedOnboarding() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Onboarding />;
}

function ProtectedDashboard() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Dashboard />;
}

function ProtectedMeetings() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Meetings />;
}

function ProtectedMeetingRoom() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <MeetingRoom />;
}

function RootRedirect() {
  return isAuthenticated() ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/dashboard" element={<ProtectedDashboard />} />
      <Route path="/meetings" element={<ProtectedMeetings />} />
      <Route path="/meetings/:id/room" element={<ProtectedMeetingRoom />} />
      <Route path="/profile" element={<ProtectedProfile />} />
      <Route path="/onboarding" element={<ProtectedOnboarding />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/matches/:userId/request" element={<SendRequest />} />
      <Route path="/requests" element={<Requests />} />
    </Routes>
  );
}
