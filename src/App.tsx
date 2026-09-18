import { Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import UserMeetings from "./components/UserMeetings";

import { isAuthenticated } from "./lib/auth";

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

  return <UserMeetings />;
}

function ProtectedHome() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Home />;
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
      <Route path="/onboarding" element={<ProtectedOnboarding />} />
      <Route path="/profile" element={<ProtectedProfile />} />
      <Route path="/meetings" element={<ProtectedMeetings />} />
      <Route path="/home" element={<ProtectedHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

