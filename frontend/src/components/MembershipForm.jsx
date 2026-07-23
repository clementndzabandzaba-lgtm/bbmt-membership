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

const DOCUMENT_SLOTS = [
  { key: "id_copy", label: "Certified ID Copy" },
  { key: "birth_certificate", label: "Birth Certificate" },
  { key: "death_certificate", label: "Death Certificate" },
];

const emptyDocuments = { id_copy: null, birth_certificate: null, death_certificate: null };

function DocumentUploadSlot({ slotKey, label, file, error, onSelect }) {
  const previewUrl = file ? URL.createObjectURL(file) : null;
  return (
    <label className={`doc-upload-slot${file ? " doc-upload-slot--filled" : ""}`}>
      <input
        type="file"
        accept="image/png"
        onChange={(e) => onSelect(slotKey, e.target.files?.[0] || null)}
      />
      {previewUrl ? (
        <img src={previewUrl} alt="" className="doc-thumb" />
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
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const navigate = useNavigate();

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
    if (file && file.type !== "image/png") {
      setDocErrors({ ...docErrors, [slotKey]: "Only PNG files are accepted" });
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
      const created = await submitRegistration({ ...form, children, grandchildren });

      const filesToUpload = Object.entries(documents).filter(([, file]) => file);
      let failedUploads = 0;
      if (filesToUpload.length > 0) {
        const results = await Promise.allSettled(
          filesToUpload.map(([docType, file]) => uploadPublicDocument(created.id, docType, file))
        );
        failedUploads = results.filter((r) => r.status === "rejected").length;
      }

      setStatus({
        state: "success",
        message:
          failedUploads > 0
            ? `Registration submitted successfully, but ${failedUploads} document${failedUploads > 1 ? "s" : ""} failed to upload — please contact the office to submit them separately.`
            : "Registration submitted successfully.",
      });
      setForm(initialForm);
      setChildren([{ ...emptyChild }]);
      setGrandchildren([{ ...emptyGrandChild }]);
      setDocuments({ ...emptyDocuments });
      setDocErrors({});
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
          <h3>Supporting Documents <span className="reg-form__subtitle">PNG only, optional</span></h3>
        </div>
        <p className="reg-form__subtitle" style={{ marginBottom: 14 }}>
          Attach certified copies to help us verify this registration faster.
        </p>
        <div className="doc-upload-grid">
          {DOCUMENT_SLOTS.map(({ key, label }) => (
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
