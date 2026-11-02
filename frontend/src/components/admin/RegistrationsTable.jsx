import { Fragment, useEffect, useRef, useState } from "react";
import StatusBadge from "./StatusBadge";
import RegistrationDetails from "./RegistrationDetails";

const COLUMN_COUNT = 13;

export default function RegistrationsTable({
  registrations,
  token,
  selectedIds = [],
  onSelectionChange,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const selectAllRef = useRef(null);

  const pageIds = registrations.map((r) => r.id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id)).length;
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedOnPage > 0 && !allOnPageSelected;
    }
  }, [selectedOnPage, allOnPageSelected]);

  const toggleSelected = (id) =>
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  // Only touches this page's rows, so selections made on other pages are kept.
  const toggleSelectPage = () =>
    onSelectionChange(
      allOnPageSelected
        ? selectedIds.filter((id) => !pageIds.includes(id))
        : [...selectedIds, ...pageIds.filter((id) => !selectedIds.includes(id))]
    );
  const wrapRef = useRef(null);
  const [wrapWidth, setWrapWidth] = useState(null);

  // The table scrolls sideways when wider than its box; the details panel is
  // pinned to the visible width so it doesn't run off-screen on small displays.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(() => setWrapWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggle = (id) => setExpandedId((current) => (current === id ? null : id));

  return (
    <div
      className="admin-dashboard__table-wrap"
      ref={wrapRef}
      style={wrapWidth ? { "--table-wrap-width": `${wrapWidth}px` } : undefined}
    >
      <table className="reg-table">
        <thead>
          <tr>
            <th className="reg-table__select">
              <input
                type="checkbox"
                ref={selectAllRef}
                checked={allOnPageSelected}
                onChange={toggleSelectPage}
                disabled={pageIds.length === 0}
                aria-label="Select all records on this page"
              />
            </th>
            <th aria-label="Expand"></th>
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
          {registrations.map((reg) => {
            const expanded = expandedId === reg.id;
            const selected = selectedIds.includes(reg.id);
            const rowClass = [
              "reg-table__row--clickable",
              reg.is_new && "admin-dashboard__row--new",
              selected && "reg-table__row--selected",
              expanded && "reg-table__row--expanded",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <Fragment key={reg.id}>
                <tr className={rowClass} onClick={() => toggle(reg.id)}>
                  <td className="reg-table__select" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelected(reg.id)}
                      aria-label={`Select ${reg.membership_number} for download`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="reg-table__expand"
                      aria-expanded={expanded}
                      aria-label={expanded ? "Hide details" : "Show details"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(reg.id);
                      }}
                    >
                      {expanded ? "▾" : "▸"}
                    </button>
                  </td>
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
                  <td onClick={(e) => e.stopPropagation()}>
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
                {expanded && (
                  <tr className="reg-table__details-row">
                    <td colSpan={COLUMN_COUNT}>
                      <RegistrationDetails registration={reg} token={token} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {registrations.length === 0 && (
            <tr>
              <td colSpan={COLUMN_COUNT} className="admin-dashboard__empty">No registrations match the current filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
