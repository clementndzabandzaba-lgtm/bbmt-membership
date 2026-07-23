export default function DeleteConfirmModal({ registration, onCancel, onConfirm, deleting }) {
  if (!registration) return null;
  const title = registration.claimant_title || registration.original_member_title || "";
  const name = registration.claimant_name || registration.original_member_name || "Unknown";

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-card__icon">🗑️</p>
        <h3>Delete this registration?</h3>
        <p>
          You're about to permanently delete the registration for <strong>{title} {name}</strong> (ID #{registration.id}),
          including all linked children, grandchildren, and documents. This cannot be undone.
        </p>
        <div className="modal-card__actions">
          <button className="modal-card__button modal-card__button--ghost" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button className="modal-card__button modal-card__button--danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
