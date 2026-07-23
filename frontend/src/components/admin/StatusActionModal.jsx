import { useState } from "react";

export default function StatusActionModal({ registration, action, onCancel, onConfirm, submitting }) {
  const [note, setNote] = useState("");
  if (!registration || !action) return null;

  const title = registration.claimant_title || registration.original_member_title || "";
  const name = registration.claimant_name || registration.original_member_name || "Unknown";
  const isApprove = action === "approved";

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-card__icon">{isApprove ? "✅" : "⛔"}</p>
        <h3>{isApprove ? "Approve" : "Reject"} registration?</h3>
        <p>
          {title} {name} (ID #{registration.id})
        </p>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left", marginBottom: 18 }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-soft)" }}>
            Note {isApprove ? "(optional)" : "(recommended)"}
          </span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isApprove ? "Any comments..." : "Reason for rejection..."}
            style={{ font: "inherit", padding: 9, border: "1px solid var(--line)", borderRadius: 8, resize: "vertical" }}
          />
        </label>
        <div className="modal-card__actions">
          <button className="modal-card__button modal-card__button--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            className={`modal-card__button${isApprove ? "" : " modal-card__button--danger"}`}
            onClick={() => onConfirm(note)}
            disabled={submitting}
          >
            {submitting ? "Saving..." : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
