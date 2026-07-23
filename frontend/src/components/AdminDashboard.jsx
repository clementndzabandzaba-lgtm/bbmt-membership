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

const PAGE_SIZE = 25;

const emptyPage = {
  items: [],
  total: 0,
  page: 1,
  page_size: PAGE_SIZE,
  pending_count: 0,
  new_count: 0,
  children_count: 0,
  grandchildren_count: 0,
};

export default function AdminDashboard({ token, onLogout }) {
  const [pageData, setPageData] = useState(emptyPage);
  const [page, setPage] = useState(1);
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

  const registrations = pageData.items;
  const username = useMemo(() => getUsernameFromToken(token) || "Admin", [token]);

  const load = useCallback(
    (activeFilters = filters, targetPage = page) => {
      setLoading(true);
      setError("");
      fetchRegistrations(token, { ...activeFilters, page: targetPage, page_size: PAGE_SIZE })
        .then((data) => {
          if (data.items.length === 0 && targetPage > 1 && data.total > 0) {
            setPage(targetPage - 1);
            return;
          }
          setPageData(data);
          const newIds = data.items.filter((r) => r.is_new).map((r) => r.id);
          if (newIds.length > 0) {
            markRegistrationsSeen(token, newIds).catch(() => {});
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [token, filters, page]
  );

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    load(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate, page]);

  const stats = useMemo(
    () => ({
      total: pageData.total,
      totalChildren: pageData.children_count,
      totalGrandchildren: pageData.grandchildren_count,
      pendingCount: pageData.pending_count,
      newCount: pageData.new_count,
    }),
    [pageData]
  );

  const countedTotal = useCountUp(stats.total, !loading);
  const countedChildren = useCountUp(stats.totalChildren, !loading);
  const countedGrandchildren = useCountUp(stats.totalGrandchildren, !loading);
  const countedPending = useCountUp(stats.pendingCount, !loading);

  const handleApplyFilters = (draft) => {
    setFilters(draft);
    setPage(1);
    load(draft, 1);
  };

  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
    load({}, 1);
  };

  const handleExport = async () => {
    if (pageData.total === 0) {
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
    if (pageData.total === 0) {
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
      await updateRegistration(token, editingRegistration.id, payload);
      setEditingRegistration(null);
      load(filters, page);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmStatus = async (note) => {
    setStatusSubmitting(true);
    try {
      await updateRegistrationStatus(token, statusAction.registration.id, statusAction.action, note);
      setStatusAction(null);
      load(filters, page);
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
      setDeleteTarget(null);
      load(filters, page);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(pageData.total / PAGE_SIZE));
  const rangeStart = pageData.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, pageData.total);

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

      <header className="admin-letterhead">
        <div className="admin-letterhead__row">
          <div className="admin-dashboard__brand">
            <img src={crestLogo} alt="BBMTC crest" className="admin-dashboard__crest" />
            <div>
              <p className="admin-letterhead__wordmark">BBMTC</p>
              <h1 className="admin-letterhead__title">
                Bakgatla Ba Mosetlha <span>Traditional Council</span>
              </h1>
              <p className="admin-letterhead__subtitle">Membership Administration System</p>
            </div>
          </div>
          <div className="admin-letterhead__actions">
            <p className="admin-dashboard__welcome">Signed in as <strong>{username}</strong></p>
            {stats.newCount > 0 && (
              <span className="admin-dashboard__notify">{stats.newCount} new registration{stats.newCount > 1 ? "s" : ""} pending review</span>
            )}
            <button onClick={handleLogout} className="admin-dashboard__logout">
              Log out
            </button>
          </div>
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
          <>
            <RegistrationsTable
              registrations={registrations}
              onEdit={setEditingRegistration}
              onApprove={(reg) => setStatusAction({ registration: reg, action: "approved" })}
              onReject={(reg) => setStatusAction({ registration: reg, action: "rejected" })}
              onDelete={setDeleteTarget}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                {pageData.total === 0 ? "No results" : `Showing ${rangeStart}–${rangeEnd} of ${pageData.total}`}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="filters-panel__reset"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="filters-panel__reset"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
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
          onImported={() => load(filters, page)}
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
