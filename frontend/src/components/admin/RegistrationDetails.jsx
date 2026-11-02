import { useState } from "react";
import { fetchDocumentBlob } from "../../api";

const DOC_TYPE_LABELS = {
  id_copy: "Certified ID Copy",
  birth_certificate: "Birth Certificate",
  death_certificate: "Death Certificate",
  power_of_attorney: "Power of Attorney",
  other: "Other",
};

const show = (value) => (value === null || value === undefined || value === "" ? "—" : value);

const fullName = (title, name) => [title, name].filter(Boolean).join(" ") || "—";

function Field({ label, value }) {
  return (
    <div className="reg-details__field">
      <dt>{label}</dt>
      <dd>{show(value)}</dd>
    </div>
  );
}

function PeopleTable({ columns, rows, empty }) {
  if (rows.length === 0) return <p className="reg-details__empty">{empty}</p>;
  return (
    <div className="reg-table-wrap">
      <table className="reg-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{show(c.render ? c.render(row) : row[c.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SPOUSE_COLUMNS = [
  { key: "name", label: "Spouse", render: (s) => fullName(s.title, s.name) },
  { key: "id_number", label: "ID Number" },
];

// Older records stored a single spouse in flat fields instead of a list.
function spousesOf(list, title, name, idNumber) {
  if (list?.length) return list;
  return name || idNumber ? [{ title, name, id_number: idNumber }] : [];
}

export default function RegistrationDetails({ registration: reg, token }) {
  const [docError, setDocError] = useState("");

  const handleViewDoc = async (doc) => {
    setDocError("");
    try {
      const blob = await fetchDocumentBlob(token, doc.id);
      window.open(window.URL.createObjectURL(blob), "_blank", "noopener");
    } catch (err) {
      setDocError(err.message);
    }
  };

  const originalSpouses = spousesOf(
    reg.original_spouses,
    reg.original_spouse_title,
    reg.original_spouse_name,
    reg.original_spouse_id_number
  );
  const claimantSpouses = spousesOf(
    reg.claimant_spouses,
    reg.claimant_spouse_title,
    reg.claimant_spouse_name,
    reg.claimant_spouse_id_number
  );
  const documents = reg.documents || [];

  return (
    <div className="reg-details">
      <section className="reg-details__section">
        <h4>Registration Details</h4>
        <dl className="reg-details__grid">
          <Field label="Membership Number" value={reg.membership_number} />
          <Field label="Kgoro" value={reg.kgoro} />
          <Field label="Mokgomane" value={reg.mokgomane} />
          <Field label="Section" value={reg.section} />
          <Field label="Receipt Number" value={reg.receipt_number} />
          <Field label="Reference No" value={reg.reference_no} />
          <Field label="Stand No" value={reg.stand_no} />
          <Field label="Zone" value={reg.zone} />
          <Field label="Updates Membership No." value={reg.update_reference} />
        </dl>
      </section>

      <section className="reg-details__section">
        <h4>Main Member <span>(Originally Dispossessed)</span></h4>
        <dl className="reg-details__grid">
          <Field label="Name" value={fullName(reg.original_member_title, reg.original_member_name)} />
          <Field label="ID Number" value={reg.original_member_id_number} />
        </dl>
        <PeopleTable columns={SPOUSE_COLUMNS} rows={originalSpouses} empty="No spouses recorded." />
      </section>

      <section className="reg-details__section">
        <h4>Main Member <span>(Main Claimant)</span></h4>
        <dl className="reg-details__grid">
          <Field label="Name" value={fullName(reg.claimant_title, reg.claimant_name)} />
          <Field label="ID Number" value={reg.claimant_id_number} />
        </dl>
        <PeopleTable columns={SPOUSE_COLUMNS} rows={claimantSpouses} empty="No spouses recorded." />
      </section>

      <section className="reg-details__section">
        <h4>Contact Details</h4>
        <dl className="reg-details__grid">
          <Field label="Relationship to Odi" value={reg.relationship_to_odi} />
          <Field label="Email" value={reg.email} />
        </dl>
      </section>

      <section className="reg-details__section">
        <h4>Children ({reg.children?.length ?? 0})</h4>
        <PeopleTable
          columns={[
            { key: "name", label: "Name" },
            { key: "id_number", label: "ID Number" },
            { key: "gender", label: "Gender" },
            { key: "contact", label: "Contact" },
          ]}
          rows={reg.children || []}
          empty="No children recorded."
        />
      </section>

      <section className="reg-details__section">
        <h4>Grandchildren ({reg.grandchildren?.length ?? 0})</h4>
        <PeopleTable
          columns={[
            { key: "name", label: "Name" },
            { key: "id_number", label: "ID Number" },
            { key: "gender", label: "Gender" },
          ]}
          rows={reg.grandchildren || []}
          empty="No grandchildren recorded."
        />
      </section>

      <section className="reg-details__section">
        <h4>Origin &amp; Additional Details</h4>
        <dl className="reg-details__grid">
          <Field label="Place of Origin" value={reg.place_of_origin} />
          <Field label="Origin / Ethnicity" value={reg.origin_ethnicity} />
          <Field label="Family Representative" value={reg.family_representative} />
          <Field label="Power of Attorney" value={reg.power_of_attorney} />
          <Field label="Business / Additional Details" value={reg.business_details} />
          <Field label="Consent Given" value={reg.consent_given ? "Yes" : "No"} />
        </dl>
      </section>

      <section className="reg-details__section">
        <h4>Review</h4>
        <dl className="reg-details__grid">
          <Field label="Status" value={reg.status} />
          <Field label="Reviewed By" value={reg.reviewed_by} />
          <Field label="Reviewed At" value={reg.reviewed_at && new Date(reg.reviewed_at).toLocaleString()} />
          <Field label="Review Note" value={reg.review_note} />
        </dl>
      </section>

      <section className="reg-details__section">
        <h4>Documents ({documents.length})</h4>
        {documents.length === 0 ? (
          <p className="reg-details__empty">No documents uploaded.</p>
        ) : (
          <ul className="reg-details__docs">
            {documents.map((doc) => (
              <li key={doc.id}>
                <span>
                  <strong>{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</strong> — {doc.filename || "file"}
                </span>
                <button type="button" className="row-actions__btn" onClick={() => handleViewDoc(doc)}>
                  View
                </button>
              </li>
            ))}
          </ul>
        )}
        {docError && <p className="doc-upload-slot__error">{docError}</p>}
      </section>
    </div>
  );
}
