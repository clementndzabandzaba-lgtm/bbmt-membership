import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./components/Landing";
import MembershipForm from "./components/MembershipForm";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import "./App.css";

const TOKEN_KEY = "bbmt_admin_token";

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));

  const handleLogin = (newToken) => {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<MembershipForm />} />
      <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
      <Route
        path="/admin"
        element={
          token ? (
            <AdminDashboard token={token} onLogout={handleLogout} />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
