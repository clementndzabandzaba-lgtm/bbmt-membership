import StatusBadge from "./StatusBadge";

export default function RegistrationsTable({ registrations, onEdit, onApprove, onReject, onDelete }) {
  return (
    <div className="admin-dashboard__table-wrap">
      <table className="reg-table">
        <thead>
          <tr>
            <th>Membership #</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>Kgoro</th>
            <th>Main Member (Claimant)</th>
            <th>Main Member ID</th>
            <th>Email</th>
            <th>Children</th>
            <th>Grandchildren</th>
            <th>Update Ref.</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => (
            <tr key={reg.id} className={reg.is_new ? "admin-dashboard__row--new" : ""}>
              <td>{reg.membership_number}</td>
              <td>{new Date(reg.created_at).toLocaleString()}</td>
              <td>
                <StatusBadge status={reg.status} />
                {reg.is_new && <span className="badge--new" style={{ marginLeft: 6 }}>New</span>}
              </td>
              <td>{reg.kgoro}</td>
              <td>{reg.claimant_name || reg.original_member_name}</td>
              <td>{reg.claimant_id_number || reg.original_member_id_number}</td>
              <td>{reg.email}</td>
              <td>{reg.children?.length ?? 0}</td>
              <td>{reg.grandchildren?.length ?? 0}</td>
              <td>{reg.update_reference || "—"}</td>
              <td>
                <div className="row-actions">
                  <button className="row-actions__btn row-actions__btn--edit" onClick={() => onEdit(reg)}>
                    Edit
                  </button>
                  {reg.status !== "approved" && (
                    <button className="row-actions__btn row-actions__btn--approve" onClick={() => onApprove(reg)}>
                      Approve
                    </button>
                  )}
                  {reg.status !== "rejected" && (
                    <button className="row-actions__btn row-actions__btn--reject" onClick={() => onReject(reg)}>
                      Reject
                    </button>
                  )}
                  <button className="row-actions__btn row-actions__btn--delete" onClick={() => onDelete(reg)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {registrations.length === 0 && (
            <tr>
              <td colSpan={11} className="admin-dashboard__empty">No registrations match the current filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
