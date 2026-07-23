const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getUsernameFromToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.sub || null;
  } catch {
    return null;
  }
}

function buildQueryString(params = {}) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    usp.set(key, value);
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function downloadBlob(url, token, fallbackFilename) {
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to download file");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackFilename;

  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export async function submitRegistration(payload) {
  const res = await fetch(`${API_URL}/api/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to submit registration");
  }
  return res.json();
}

export async function uploadPublicDocument(registrationId, docType, file) {
  const form = new FormData();
  form.append("doc_type", docType);
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/registrations/${registrationId}/documents`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to upload document");
  }
  return res.json();
}

export async function adminLogin(username, password) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Login failed");
  }
  return res.json();
}

export async function fetchRegistrations(token, filters = {}) {
  const res = await fetch(`${API_URL}/api/admin/registrations${buildQueryString(filters)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load registrations");
  return res.json();
}

export async function fetchRegistration(token, id) {
  const res = await fetch(`${API_URL}/api/admin/registrations/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load registration");
  return res.json();
}

export async function updateRegistration(token, id, payload) {
  const res = await fetch(`${API_URL}/api/admin/registrations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to update registration");
  }
  return res.json();
}

export async function updateRegistrationStatus(token, id, statusValue, reviewNote) {
  const res = await fetch(`${API_URL}/api/admin/registrations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ status: statusValue, review_note: reviewNote || null }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to update status");
  }
  return res.json();
}

export async function deleteRegistration(token, id) {
  const res = await fetch(`${API_URL}/api/admin/registrations/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete registration");
}

export async function downloadExcel(token, filters = {}) {
  await downloadBlob(
    `${API_URL}/api/admin/registrations/export${buildQueryString(filters)}`,
    token,
    "bbmt_membership.xlsx"
  );
}

export async function downloadCsv(token, filters = {}) {
  await downloadBlob(
    `${API_URL}/api/admin/registrations/export.csv${buildQueryString(filters)}`,
    token,
    "bbmt_membership.csv"
  );
}

export async function importRegistrationsCsv(token, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/admin/registrations/import`, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to import CSV");
  }
  return res.json();
}

export async function uploadAdminDocument(token, registrationId, docType, file) {
  const form = new FormData();
  form.append("doc_type", docType);
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/admin/registrations/${registrationId}/documents`, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to upload document");
  }
  return res.json();
}

export async function fetchDocumentBlob(token, documentId) {
  const res = await fetch(`${API_URL}/api/admin/documents/${documentId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load document");
  return res.blob();
}

export async function deleteDocument(token, documentId) {
  const res = await fetch(`${API_URL}/api/admin/documents/${documentId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function fetchAuditLog(token, registrationId) {
  const res = await fetch(
    `${API_URL}/api/admin/audit-log${buildQueryString({ registration_id: registrationId })}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) throw new Error("Failed to load activity log");
  return res.json();
}

export async function markRegistrationsSeen(token, ids = null) {
  const res = await fetch(`${API_URL}/api/admin/registrations/mark-seen`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to mark registrations as seen");
}
