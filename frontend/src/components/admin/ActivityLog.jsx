import { useEffect, useState } from "react";
import { fetchAuditLog } from "../../api";

const ACTION_LABELS = {
  edited: "Edited",
  approved: "Approved",
  rejected: "Rejected",
  pending: "Reset to pending",
  deleted: "Deleted",
  document_uploaded: "Document uploaded",
  document_deleted: "Document deleted",
  created_via_import: "Created/updated via CSV import",
};

export default function ActivityLog({ registrationId, token }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAuditLog(token, registrationId)
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, registrationId]);

  return (
    <section className="reg-form__section">
      <div className="reg-form__section-header">
        <h3>Activity</h3>
      </div>
      {loading && <p className="admin-dashboard__loading">Loading...</p>}
      {error && <p className="reg-form__message reg-form__message--error">⚠ {error}</p>}
      {!loading && !error && entries.length === 0 && (
        <p className="admin-dashboard__empty">No activity recorded yet.</p>
      )}
      {!loading && entries.length > 0 && (
        <div className="reg-table-wrap">
          <table className="reg-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                  <td>{entry.admin_username}</td>
                  <td>{ACTION_LABELS[entry.action] || entry.action}</td>
                  <td>{entry.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
