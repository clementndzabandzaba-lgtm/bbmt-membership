import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { downloadExcel, fetchRegistrations, getUsernameFromToken } from "../api";
import crestLogo from "../assets/brand/crest.png";
import monkeySilhouette from "../assets/brand/monkey-silhouette.png";

function useCountUp(target, active, duration = 800) {
  const [value, setValue] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const start = performance.now();
    const from = 0;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, active, duration]);

  return value;
}

export default function AdminDashboard({ token, onLogout }) {
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const navigate = useNavigate();

  const username = useMemo(() => getUsernameFromToken(token) || "Admin", [token]);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchRegistrations(token)
      .then(setRegistrations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const stats = useMemo(() => {
    const totalChildren = registrations.reduce((sum, r) => sum + (r.children?.length ?? 0), 0);
    const totalGrandchildren = registrations.reduce((sum, r) => sum + (r.grandchildren?.length ?? 0), 0);
    const latest = registrations
      .map((r) => new Date(r.created_at))
      .sort((a, b) => b - a)[0];
    return {
      total: registrations.length,
      totalChildren,
      totalGrandchildren,
      latest: latest ? latest.toLocaleDateString() : "—",
    };
  }, [registrations]);

  const countedTotal = useCountUp(stats.total, !loading);
  const countedChildren = useCountUp(stats.totalChildren, !loading);
  const countedGrandchildren = useCountUp(stats.totalGrandchildren, !loading);

  const handleExport = async () => {
    if (registrations.length === 0) {
      setShowEmptyModal(true);
      return;
    }
    setExporting(true);
    setError("");
    try {
      await downloadExcel(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-dashboard">
      <div className="watermark" aria-hidden="true">
        <span className="watermark__text">BBMT</span>
        <img src={monkeySilhouette} className="watermark__monkey" alt="" />
      </div>

      <header className="admin-dashboard__topbar">
        <div className="admin-dashboard__brand">
          <img src={crestLogo} alt="BBMTC crest" className="admin-dashboard__crest" />
          <div>
            <p className="admin-dashboard__eyebrow">BBMTC Admin</p>
            <p className="admin-dashboard__welcome">Welcome back, <strong>{username}</strong></p>
          </div>
        </div>
        <button onClick={handleLogout} className="admin-dashboard__logout">
          Log out
        </button>
      </header>

      <div className="admin-stats">
        <div className="admin-stats__card admin-stats__card--1">
          <p className="admin-stats__label">Total Registrations</p>
          <p className="admin-stats__value">{countedTotal}</p>
        </div>
        <div className="admin-stats__card admin-stats__card--2">
          <p className="admin-stats__label">Children Registered</p>
          <p className="admin-stats__value">{countedChildren}</p>
        </div>
        <div className="admin-stats__card admin-stats__card--3">
          <p className="admin-stats__label">Grandchildren Registered</p>
          <p className="admin-stats__value">{countedGrandchildren}</p>
        </div>
        <div className="admin-stats__card admin-stats__card--4">
          <p className="admin-stats__label">Latest Submission</p>
          <p className="admin-stats__value admin-stats__value--small">{stats.latest}</p>
        </div>
      </div>

      <section className="admin-dashboard__section">
        <div className="admin-dashboard__section-header">
          <h2>Membership Registrations</h2>
          <button className="admin-dashboard__export" onClick={handleExport} disabled={exporting || loading}>
            {exporting ? "Preparing file..." : "⬇ Download as Excel"}
          </button>
        </div>

        {error && <p className="reg-form__message reg-form__message--error">⚠ {error}</p>}
        {loading ? (
          <p className="admin-dashboard__loading">Loading...</p>
        ) : (
          <div className="admin-dashboard__table-wrap">
            <table className="reg-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Submitted</th>
                  <th>Kgoro</th>
                  <th>Main Member (Claimant)</th>
                  <th>Main Member ID</th>
                  <th>Email</th>
                  <th>Children</th>
                  <th>Grandchildren</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td>{reg.id}</td>
                    <td>{new Date(reg.created_at).toLocaleString()}</td>
                    <td>{reg.kgoro}</td>
                    <td>{reg.claimant_name || reg.original_member_name}</td>
                    <td>{reg.claimant_id_number || reg.original_member_id_number}</td>
                    <td>{reg.email}</td>
                    <td>{reg.children?.length ?? 0}</td>
                    <td>{reg.grandchildren?.length ?? 0}</td>
                  </tr>
                ))}
                {registrations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="admin-dashboard__empty">No registrations yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showEmptyModal && (
        <div className="modal-overlay" onClick={() => setShowEmptyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="modal-card__icon">📄</p>
            <h3>Nothing to export yet</h3>
            <p>There are no membership registrations in the system yet, so there's no data to download.</p>
            <button className="modal-card__button" onClick={() => setShowEmptyModal(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
