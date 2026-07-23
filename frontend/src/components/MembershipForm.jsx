import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitRegistration, uploadPublicDocument } from "../api";
import RegistrationFormFields from "./RegistrationFormFields";
import crestLogo from "../assets/brand/crest.png";
import monkeyBanner from "../assets/brand/monkey-banner.png";
import monkeySilhouette from "../assets/brand/monkey-silhouette.png";
import whatsappIcon from "../assets/brand/whatsapp.png";

const emptyChild = { name: "", id_number: "", gender: "", contact: "" };
const emptyGrandChild = { name: "", id_number: "", gender: "" };

const initialForm = {
  kgoro: "",
  mokgomane: "",
  section: "",
  receipt_number: "",
  reference_no: "",
  stand_no: "",
  zone: "",
  update_reference: "",

  original_member_title: "",
  original_member_name: "",
  original_member_id_number: "",
  original_spouse_title: "",
  original_spouse_name: "",
  original_spouse_id_number: "",

  claimant_title: "",
  claimant_name: "",
  claimant_id_number: "",
  claimant_spouse_title: "",
  claimant_spouse_name: "",
  claimant_spouse_id_number: "",

  relationship_to_odi: "",
  email: "",

  place_of_origin: "",
  business_details: "",
  origin_ethnicity: "",
  family_representative: "",
  power_of_attorney: "",
};

const BASE_DOCUMENT_SLOTS = [
  { key: "id_copy", label: "Certified ID Copy" },
  { key: "birth_certificate", label: "Birth Certificate" },
  { key: "death_certificate", label: "Death Certificate" },
];

const emptyDocuments = { id_copy: null, birth_certificate: null, death_certificate: null, power_of_attorney: null };

const ACCEPTED_DOC_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const ACCEPTED_DOC_ATTR = ACCEPTED_DOC_TYPES.join(",");

function DocumentUploadSlot({ slotKey, label, file, error, onSelect }) {
  const isPreviewable = file && file.type !== "application/pdf";
  const previewUrl = isPreviewable ? URL.createObjectURL(file) : null;
  return (
    <label className={`doc-upload-slot${file ? " doc-upload-slot--filled" : ""}`}>
      <input
        type="file"
        accept={ACCEPTED_DOC_ATTR}
        onChange={(e) => onSelect(slotKey, e.target.files?.[0] || null)}
      />
      {previewUrl ? (
        <img src={previewUrl} alt="" className="doc-thumb" />
      ) : file ? (
        <span aria-hidden="true">📄</span>
      ) : (
        <span aria-hidden="true">📎</span>
      )}
      <span className="doc-upload-slot__label">{file ? file.name : label}</span>
      {error && <span className="doc-upload-slot__error">{error}</span>}
    </label>
  );
}

export default function MembershipForm() {
  const [form, setForm] = useState(initialForm);
  const [children, setChildren] = useState([{ ...emptyChild }]);
  const [grandchildren, setGrandchildren] = useState([{ ...emptyGrandChild }]);
  const [documents, setDocuments] = useState({ ...emptyDocuments });
  const [docErrors, setDocErrors] = useState({});
  const [consentGiven, setConsentGiven] = useState(false);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const navigate = useNavigate();

  const documentSlots = [
    ...BASE_DOCUMENT_SLOTS,
    ...(form.power_of_attorney === "Yes" ? [{ key: "power_of_attorney", label: "Power of Attorney Copy" }] : []),
  ];

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const updateChild = (index, field) => (e) => {
    const next = [...children];
    next[index] = { ...next[index], [field]: e.target.value };
    setChildren(next);
  };

  const updateGrandchild = (index, field) => (e) => {
    const next = [...grandchildren];
    next[index] = { ...next[index], [field]: e.target.value };
    setGrandchildren(next);
  };

  const addChildRow = () => setChildren([...children, { ...emptyChild }]);
  const removeChildRow = (index) =>
    setChildren(children.filter((_, i) => i !== index));

  const addGrandchildRow = () => setGrandchildren([...grandchildren, { ...emptyGrandChild }]);
  const removeGrandchildRow = (index) =>
    setGrandchildren(grandchildren.filter((_, i) => i !== index));

  const selectDocument = (slotKey, file) => {
    if (file && !ACCEPTED_DOC_TYPES.includes(file.type)) {
      setDocErrors({ ...docErrors, [slotKey]: "Only PNG, JPEG, or PDF files are accepted" });
      setDocuments({ ...documents, [slotKey]: null });
      return;
    }
    setDocErrors({ ...docErrors, [slotKey]: null });
    setDocuments({ ...documents, [slotKey]: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "submitting", message: "" });
    try {
      const created = await submitRegistration({ ...form, children, grandchildren, consent_given: consentGiven });

      const filesToUpload = Object.entries(documents).filter(([, file]) => file);
      let failedUploads = 0;
      if (filesToUpload.length > 0) {
        const results = await Promise.allSettled(
          filesToUpload.map(([docType, file]) => uploadPublicDocument(created.id, docType, file))
        );
        failedUploads = results.filter((r) => r.status === "rejected").length;
      }

      const membershipNote = `Your Membership Number is ${created.membership_number} — keep this for future reference if you ever need to update these details.`;
      setStatus({
        state: "success",
        message:
          failedUploads > 0
            ? `Registration submitted successfully, but ${failedUploads} document${failedUploads > 1 ? "s" : ""} failed to upload — please contact the office to submit them separately. ${membershipNote}`
            : `Registration submitted successfully. ${membershipNote}`,
      });
      setForm(initialForm);
      setChildren([{ ...emptyChild }]);
      setGrandchildren([{ ...emptyGrandChild }]);
      setDocuments({ ...emptyDocuments });
      setDocErrors({});
      setConsentGiven(false);
    } catch (err) {
      setStatus({ state: "error", message: err.message });
    }
  };

  return (
    <form className="reg-form" onSubmit={handleSubmit}>
      <div className="watermark" aria-hidden="true">
        <span className="watermark__text">BBMT</span>
        <img src={monkeySilhouette} className="watermark__monkey" alt="" />
      </div>

      <header className="letterhead">
        <p className="letterhead__wordmark">BBMTC</p>
        <h1 className="letterhead__title">
          Bakgatla Ba Mosetlha
          <span>Traditional Council</span>
        </h1>

        <div className="letterhead__row">
          <div className="letterhead__contacts">
            <div>
              <h4>Administrative Office</h4>
              <p>2228 Mosate Section</p>
              <p>Makapanstad</p>
              <p>0404</p>
              <p>
                <img src={whatsappIcon} alt="" className="letterhead__icon" /> Tel: 064 666 1756
              </p>
              <p>www.bbmtc.co.za</p>
            </div>
            <div>
              <h4>The Registra</h4>
              <p>P.O. Box 1</p>
              <p>Makapanstad</p>
              <p>0404</p>
              <p>
                <img src={whatsappIcon} alt="" className="letterhead__icon" /> Cell: 0619745139
              </p>
              <p>info@bbmtc.co.za</p>
            </div>
          </div>
          <div className="letterhead__crest">
            <img src={crestLogo} alt="BBMTC crest: Maiyane a Kgabo Tona, Sedibelo" />
            <img src={monkeyBanner} alt="" className="letterhead__monkey" />
          </div>
        </div>

        <p className="letterhead__form-title">Membership Registration Form</p>
      </header>

      <RegistrationFormFields
        form={form}
        update={update}
        childrenList={children}
        updateChild={updateChild}
        addChildRow={addChildRow}
        removeChildRow={removeChildRow}
        grandchildren={grandchildren}
        updateGrandchild={updateGrandchild}
        addGrandchildRow={addGrandchildRow}
        removeGrandchildRow={removeGrandchildRow}
        requireFields
      />

      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Supporting Documents <span className="reg-form__subtitle">PNG, JPEG, or PDF — optional</span></h3>
        </div>
        <p className="reg-form__subtitle" style={{ marginBottom: 14 }}>
          Attach certified copies to help us verify this registration faster.
          {form.power_of_attorney === "Yes" && " Since you answered Yes to Power of Attorney, please also attach a copy of it below."}
        </p>
        <div className="doc-upload-grid">
          {documentSlots.map(({ key, label }) => (
            <DocumentUploadSlot
              key={key}
              slotKey={key}
              label={label}
              file={documents[key]}
              error={docErrors[key]}
              onSelect={selectDocument}
            />
          ))}
        </div>
      </section>

      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Privacy &amp; Consent</h3>
        </div>
        <p className="reg-form__subtitle" style={{ marginBottom: 12 }}>
          The information on this form, including ID numbers and any attached documents, is collected
          solely for BBMTC membership administration. It is retained under the Council's record-keeping
          policy and is only accessible to authorised administrators.
        </p>
        <label style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <input
            type="checkbox"
            required
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span style={{ fontWeight: 500, color: "var(--ink)" }}>
            I consent to the Bakgatla Ba Mosetlha Traditional Council collecting and processing this
            information for membership registration purposes.
          </span>
        </label>
      </section>

      {status.state === "error" && (
        <p className="reg-form__message reg-form__message--error">⚠ {status.message}</p>
      )}
      {status.state === "success" && (
        <p className="reg-form__message reg-form__message--success">✓ {status.message}</p>
      )}

      <div className="reg-form__submit-bar">
        <button type="submit" className="reg-form__submit" disabled={status.state === "submitting"}>
          {status.state === "submitting" ? "Submitting..." : "Submit Registration"}
        </button>
        <button
          type="button"
          className="reg-form__back"
          onClick={() => navigate("/")}
          disabled={status.state === "submitting"}
        >
          ← Back
        </button>
      </div>
    </form>
  );
}
