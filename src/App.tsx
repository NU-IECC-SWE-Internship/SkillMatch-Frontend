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
import Requests from "./pages/Requests";
import { isAuthenticated } from './lib/auth'
import MyRequests from "./pages/MyRequests";



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
      <Route path="/profile" element={<ProtectedProfile />} />
      <Route path="/onboarding" element={<ProtectedOnboarding />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/matches/:userId/request" element={<SendRequest />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/my-requests" element={<MyRequests />} />
    </Routes>
  );
}
