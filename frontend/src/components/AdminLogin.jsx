import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api";
import crestLogo from "../assets/brand/crest.png";
import monkeySilhouette from "../assets/brand/monkey-silhouette.png";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await adminLogin(username, password);
      onLogin(access_token);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-portal">
      <div className="admin-portal__brand">
        <div className="admin-portal__watermark" aria-hidden="true">BBMT</div>
        <img src={monkeySilhouette} className="admin-portal__watermark-monkey" alt="" aria-hidden="true" />
        <div className="admin-portal__badge">
          <img src={crestLogo} alt="BBMTC crest" />
        </div>
        <p className="admin-portal__eyebrow">BBMTC</p>
        <h1 className="admin-portal__brand-title">
          Bakgatla Ba Mosetlha
          <span>Traditional Council</span>
        </h1>
        <p className="admin-portal__tagline">Membership Administration Portal</p>
      </div>

      <div className="admin-portal__panel">
        <form onSubmit={handleSubmit} className="admin-portal__form">
          <p className="admin-portal__welcome-eyebrow">Welcome back</p>
          <h2>Admin Sign In</h2>
          <p className="admin-portal__subtitle">
            Sign in to review membership registrations and export the member list.
          </p>

          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="reg-form__message reg-form__message--error">⚠ {error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
