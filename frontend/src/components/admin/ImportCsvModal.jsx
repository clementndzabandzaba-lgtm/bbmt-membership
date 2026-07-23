import { useState } from "react";
import { importRegistrationsCsv } from "../../api";

export default function ImportCsvModal({ token, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const result = await importRegistrationsCsv(token, file);
      setSummary(result);
      onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <h3>Import registrations from CSV</h3>
        <p>
          Upload a CSV exported from this system (or matching its column headers). Rows with an existing{" "}
          <strong>ID</strong> update that registration; rows without a matching ID are created as new.
          Children and grandchildren are not affected by import.
        </p>

        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />

        {error && <p className="reg-form__message reg-form__message--error">⚠ {error}</p>}

        {summary && (
          <>
            <div className="import-summary">
              <span className="import-summary__stat import-summary__stat--created">Created: {summary.created}</span>
              <span className="import-summary__stat import-summary__stat--updated">Updated: {summary.updated}</span>
              <span className="import-summary__stat import-summary__stat--skipped">Skipped: {summary.skipped}</span>
            </div>
            {summary.errors.length > 0 && (
              <div className="import-summary__errors">
                {summary.errors.map((e, i) => (
                  <div key={i}>Row {e.row}: {e.error}</div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="modal-card__actions" style={{ marginTop: 18 }}>
          <button className="modal-card__button modal-card__button--ghost" onClick={onClose}>
            Close
          </button>
          <button className="modal-card__button" onClick={handleImport} disabled={!file || importing}>
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
