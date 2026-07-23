import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteRegistration,
  downloadCsv,
  downloadExcel,
  fetchRegistrations,
  getUsernameFromToken,
  markRegistrationsSeen,
  updateRegistration,
  updateRegistrationStatus,
} from "../api";
import crestLogo from "../assets/brand/crest.png";
import monkeySilhouette from "../assets/brand/monkey-silhouette.png";
import FiltersPanel from "./admin/FiltersPanel";
import RegistrationsTable from "./admin/RegistrationsTable";
import EditRegistrationModal from "./admin/EditRegistrationModal";
import DeleteConfirmModal from "./admin/DeleteConfirmModal";
import StatusActionModal from "./admin/StatusActionModal";
import ImportCsvModal from "./admin/ImportCsvModal";

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
  const [exportingCsv, setExportingCsv] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [filters, setFilters] = useState({});
  const [showImportModal, setShowImportModal] = useState(false);

  const [editingRegistration, setEditingRegistration] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [statusAction, setStatusAction] = useState(null); // { registration, action }
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const username = useMemo(() => getUsernameFromToken(token) || "Admin", [token]);

  const load = useCallback(
    (activeFilters = filters) => {
      setLoading(true);
      setError("");
      fetchRegistrations(token, activeFilters)
        .then((data) => {
          setRegistrations(data);
          const newIds = data.filter((r) => r.is_new).map((r) => r.id);
          if (newIds.length > 0) {
            markRegistrationsSeen(token, newIds).catch(() => {});
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [token, filters]
  );

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    load({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  const stats = useMemo(() => {
    const totalChildren = registrations.reduce((sum, r) => sum + (r.children?.length ?? 0), 0);
    const totalGrandchildren = registrations.reduce((sum, r) => sum + (r.grandchildren?.length ?? 0), 0);
    const pendingCount = registrations.filter((r) => r.status === "pending").length;
    const newCount = registrations.filter((r) => r.is_new).length;
    const latest = registrations
      .map((r) => new Date(r.created_at))
      .sort((a, b) => b - a)[0];
    return {
      total: registrations.length,
      totalChildren,
      totalGrandchildren,
      pendingCount,
      newCount,
      latest: latest ? latest.toLocaleDateString() : "—",
    };
  }, [registrations]);

  const countedTotal = useCountUp(stats.total, !loading);
  const countedChildren = useCountUp(stats.totalChildren, !loading);
  const countedGrandchildren = useCountUp(stats.totalGrandchildren, !loading);
  const countedPending = useCountUp(stats.pendingCount, !loading);

  const handleApplyFilters = (draft) => {
    setFilters(draft);
    load(draft);
  };

  const handleResetFilters = () => {
    setFilters({});
    load({});
  };

  const handleExport = async () => {
    if (registrations.length === 0) {
      setShowEmptyModal(true);
      return;
    }
    setExporting(true);
    setError("");
    try {
      await downloadExcel(token, filters);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    if (registrations.length === 0) {
      setShowEmptyModal(true);
      return;
    }
    setExportingCsv(true);
    setError("");
    try {
      await downloadCsv(token, filters);
    } catch (err) {
      setError(err.message);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleSaveEdit = async (payload) => {
    setEditSaving(true);
    setEditError("");
    try {
      const updated = await updateRegistration(token, editingRegistration.id, payload);
      setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      setEditingRegistration(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmStatus = async (note) => {
    setStatusSubmitting(true);
    try {
      const updated = await updateRegistrationStatus(token, statusAction.registration.id, statusAction.action, note);
      setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      setStatusAction(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteRegistration(token, deleteTarget.id);
      setRegistrations((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {stats.newCount > 0 && (
            <span className="admin-dashboard__notify">🔔 {stats.newCount} new registration{stats.newCount > 1 ? "s" : ""}</span>
          )}
          <button onClick={handleLogout} className="admin-dashboard__logout">
            Log out
          </button>
        </div>
      </header>

      <div className="admin-stats">
        <div className="admin-stats__card admin-stats__card--1">
          <p className="admin-stats__label">Total Registrations</p>
          <p className="admin-stats__value">{countedTotal}</p>
        </div>
        <div className="admin-stats__card admin-stats__card--2">
          <p className="admin-stats__label">Pending Review</p>
          <p className="admin-stats__value">{countedPending}</p>
        </div>
        <div className="admin-stats__card admin-stats__card--3">
          <p className="admin-stats__label">Children Registered</p>
          <p className="admin-stats__value">{countedChildren}</p>
        </div>
        <div className="admin-stats__card admin-stats__card--4">
          <p className="admin-stats__label">Grandchildren Registered</p>
          <p className="admin-stats__value">{countedGrandchildren}</p>
        </div>
      </div>

      <FiltersPanel onApply={handleApplyFilters} onReset={handleResetFilters} />

      <section className="admin-dashboard__section">
        <div className="admin-dashboard__section-header">
          <h2>Membership Registrations</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="admin-dashboard__export" onClick={() => setShowImportModal(true)}>
              ⬆ Import CSV
            </button>
            <button className="admin-dashboard__export" onClick={handleExportCsv} disabled={exportingCsv || loading}>
              {exportingCsv ? "Preparing..." : "⬇ Download as CSV"}
            </button>
            <button className="admin-dashboard__export" onClick={handleExport} disabled={exporting || loading}>
              {exporting ? "Preparing file..." : "⬇ Download as Excel"}
            </button>
          </div>
        </div>

        {error && <p className="reg-form__message reg-form__message--error">⚠ {error}</p>}
        {loading ? (
          <p className="admin-dashboard__loading">Loading...</p>
        ) : (
          <RegistrationsTable
            registrations={registrations}
            onEdit={setEditingRegistration}
            onApprove={(reg) => setStatusAction({ registration: reg, action: "approved" })}
            onReject={(reg) => setStatusAction({ registration: reg, action: "rejected" })}
            onDelete={setDeleteTarget}
          />
        )}
      </section>

      {editingRegistration && (
        <EditRegistrationModal
          registration={editingRegistration}
          token={token}
          onCancel={() => {
            setEditingRegistration(null);
            setEditError("");
          }}
          onSave={handleSaveEdit}
          saving={editSaving}
          error={editError}
        />
      )}

      {statusAction && (
        <StatusActionModal
          registration={statusAction.registration}
          action={statusAction.action}
          onCancel={() => setStatusAction(null)}
          onConfirm={handleConfirmStatus}
          submitting={statusSubmitting}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          registration={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          deleting={deleting}
        />
      )}

      {showImportModal && (
        <ImportCsvModal
          token={token}
          onClose={() => setShowImportModal(false)}
          onImported={() => load(filters)}
        />
      )}

      {showEmptyModal && (
        <div className="modal-overlay" onClick={() => setShowEmptyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="modal-card__icon">📄</p>
            <h3>Nothing to export yet</h3>
            <p>There are no membership registrations matching the current filters, so there's no data to download.</p>
            <button className="modal-card__button" onClick={() => setShowEmptyModal(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
