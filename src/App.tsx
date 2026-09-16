import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Matches from "./pages/Matches";
import SendRequest from "./pages/SendRequest";

import { isAuthenticated } from './lib/auth'

function ProtectedHome() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Home />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/matches" element={<Matches />} />\
      <Route path="/matches/:userId/request" element={<SendRequest />} />
    </Routes>
  )
}
