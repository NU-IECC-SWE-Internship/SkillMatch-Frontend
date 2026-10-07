import type { ReactElement } from 'react'
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
import SkillBrowse from "./pages/SkillBrowse";
import { homePath, isAuthenticated, isStaffUser } from './lib/auth'
import MyRequests from "./pages/MyRequests";
import SkillQuiz from "./pages/SkillQuiz";
import AdminSkills from "./pages/AdminSkills";
import AdminSkillQuestions from "./pages/AdminSkillQuestions";
import AdminOverview from "./pages/AdminOverview";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";

import UserProfile from "./pages/UserProfile";

// function ProtectedHome() {
//   if (!isAuthenticated()) {
//     return <Navigate to="/login" replace />;
//   }

//   return <Home />;
// }




// Admin accounts only use the admin dashboard.
function UserOnly({ children }: { children: ReactElement }) {
  if (isStaffUser()) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

function ProtectedProfile() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <UserOnly><Profile /></UserOnly>;
}

function ProtectedOnboarding() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <UserOnly><Onboarding /></UserOnly>;
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
  return <UserOnly><Meetings /></UserOnly>;
}

function ProtectedMeetingRoom() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <UserOnly><MeetingRoom /></UserOnly>;
}

function ProtectedSkillQuiz() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <UserOnly><SkillQuiz /></UserOnly>;
}

function AuthOnly({ children }: { children: ReactElement }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RootRedirect() {
  return isAuthenticated() ? (
    <Navigate to={homePath()} replace />
  ) : (
    <Navigate to="/login" replace />
  );
}
function ProtectedUserProfile() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <UserOnly><UserProfile /></UserOnly>;
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
      <Route path="/skills/:skillId/quiz" element={<ProtectedSkillQuiz />} />
      <Route path="/admin" element={<AuthOnly><AdminOverview /></AuthOnly>} />
      <Route path="/admin/users" element={<AuthOnly><AdminUsers /></AuthOnly>} />
      <Route path="/admin/users/:userId" element={<AuthOnly><AdminUserDetail /></AuthOnly>} />
      <Route path="/admin/skills" element={<AuthOnly><AdminSkills /></AuthOnly>} />
      <Route path="/admin/skills/:skillId/questions" element={<AuthOnly><AdminSkillQuestions /></AuthOnly>} />
      <Route path="/onboarding" element={<ProtectedOnboarding />} />
      <Route path="/matches" element={<UserOnly><Matches /></UserOnly>} />
      <Route path="/matches/:userId/request" element={<UserOnly><SendRequest /></UserOnly>} />
      <Route path="/requests" element={<UserOnly><Requests /></UserOnly>} />
      <Route path="/my-requests" element={<UserOnly><MyRequests /></UserOnly>} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/skillbrowse" element={<UserOnly><SkillBrowse /></UserOnly>} />
      <Route path="/users/:userId" element={<ProtectedUserProfile />} />
    </Routes>
  );
}
