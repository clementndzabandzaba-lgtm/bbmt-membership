import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api";
import crestLogo from "../assets/brand/crest.png";
import monkeySilhouette from "../assets/brand/monkey-silhouette.png";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="admin-portal__password">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="admin-portal__password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <line x1="3" y1="3" x2="21" y2="21" />}
                </svg>
              </button>
            </div>
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
