import { useState } from "react";
import { deleteDocument, fetchDocumentBlob, uploadAdminDocument } from "../../api";

const DOC_TYPES = [
  { value: "id_copy", label: "Certified ID Copy" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "death_certificate", label: "Death Certificate" },
  { value: "other", label: "Other" },
];

export default function DocumentsPanel({ registrationId, token, documents = [] }) {
  const [docs, setDocs] = useState(documents);
  const [docType, setDocType] = useState("id_copy");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleView = async (doc) => {
    try {
      const blob = await fetchDocumentBlob(token, doc.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (doc) => {
    try {
      await deleteDocument(token, doc.id);
      setDocs(docs.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.type !== "image/png") {
      setError("Only PNG files are accepted");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const created = await uploadAdminDocument(token, registrationId, docType, file);
      setDocs([...docs, created]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <section className="reg-form__section">
      <div className="reg-form__section-header">
        <h3>Documents</h3>
      </div>

      {docs.length === 0 ? (
        <p className="admin-dashboard__empty">No documents uploaded yet.</p>
      ) : (
        <div className="reg-table-wrap" style={{ marginBottom: 14 }}>
          <table className="reg-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Filename</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id}>
                  <td>{DOC_TYPES.find((t) => t.value === doc.doc_type)?.label || doc.doc_type}</td>
                  <td>{doc.filename || "—"}</td>
                  <td>{new Date(doc.uploaded_at).toLocaleString()}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="row-actions__btn" onClick={() => handleView(doc)}>
                        View
                      </button>
                      <button
                        type="button"
                        className="row-actions__btn row-actions__btn--delete"
                        onClick={() => handleDelete(doc)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select value={docType} onChange={(e) => setDocType(e.target.value)}>
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="reg-form__add-btn" style={{ cursor: "pointer" }}>
          {uploading ? "Uploading..." : "+ Upload PNG"}
          <input type="file" accept="image/png" onChange={handleUpload} disabled={uploading} style={{ display: "none" }} />
        </label>
        {error && <span className="doc-upload-slot__error">{error}</span>}
      </div>
    </section>
  );
}
