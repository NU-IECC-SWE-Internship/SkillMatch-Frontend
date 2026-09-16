import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import UserMeetings from './components/UserMeetings'
import { isAuthenticated } from './lib/auth'

function ProtectedHome() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Home />
}

function ProtectedMeetings() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <UserMeetings />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/meetings" element={<ProtectedMeetings />} />
      <Route path="/" element={<ProtectedHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

