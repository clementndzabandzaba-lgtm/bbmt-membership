const LABELS = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

export default function StatusBadge({ status }) {
  const value = status || "pending";
  return <span className={`status-badge status-badge--${value}`}>{LABELS[value] || value}</span>;
}
