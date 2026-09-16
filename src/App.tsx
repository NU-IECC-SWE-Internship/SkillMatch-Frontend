import { Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import { isAuthenticated } from "./lib/auth";


function ProtectedHome() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Home />;
}


function ProtectedProfile() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Profile />;
}


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/" element={<ProtectedHome />} />

      <Route path="/profile" element={<ProtectedProfile />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}