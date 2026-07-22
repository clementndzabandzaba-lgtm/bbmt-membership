import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitRegistration } from "../api";
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

function TitleSelect({ label, value, onChange, options = ["Mr", "Mrs", "Ms"], required = true }) {
  return (
    <select value={value} onChange={onChange} aria-label={label} required={required}>
      <option value="">Title</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export default function MembershipForm() {
  const [form, setForm] = useState(initialForm);
  const [children, setChildren] = useState([{ ...emptyChild }]);
  const [grandchildren, setGrandchildren] = useState([{ ...emptyGrandChild }]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "submitting", message: "" });
    try {
      await submitRegistration({ ...form, children, grandchildren });
      setStatus({ state: "success", message: "Registration submitted successfully." });
      setForm(initialForm);
      setChildren([{ ...emptyChild }]);
      setGrandchildren([{ ...emptyGrandChild }]);
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

      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Registration Details</h3>
        </div>
        <div className="grid grid--3">
          <label>
            Kgoro
            <input required value={form.kgoro} onChange={update("kgoro")} />
          </label>
          <label>
            Mokgomane
            <input required value={form.mokgomane} onChange={update("mokgomane")} />
          </label>
          <label>
            Section
            <input required value={form.section} onChange={update("section")} />
          </label>
          <label>
            Receipt Number
            <input required value={form.receipt_number} onChange={update("receipt_number")} />
          </label>
          <label>
            Reference No
            <input required value={form.reference_no} onChange={update("reference_no")} />
          </label>
          <label>
            Stand No
            <input required value={form.stand_no} onChange={update("stand_no")} />
          </label>
          <label>
            Zone
            <input required value={form.zone} onChange={update("zone")} />
          </label>
        </div>
      </section>

      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Main Member <span className="reg-form__subtitle">(Originally Dispossessed)</span></h3>
        </div>
        <div className="grid grid--2">
          <div className="name-field">
            <span>Main Member</span>
            <div className="name-field__row">
              <TitleSelect value={form.original_member_title} onChange={update("original_member_title")} />
              <input
                required
                placeholder="Full name"
                value={form.original_member_name}
                onChange={update("original_member_name")}
              />
            </div>
            <input
              required
              placeholder="ID number"
              value={form.original_member_id_number}
              onChange={update("original_member_id_number")}
            />
          </div>
          <div className="name-field">
            <span>Spouse</span>
            <div className="name-field__row">
              <TitleSelect
                value={form.original_spouse_title}
                onChange={update("original_spouse_title")}
                options={["Mr", "Mrs"]}
              />
              <input
                required
                placeholder="Full name"
                value={form.original_spouse_name}
                onChange={update("original_spouse_name")}
              />
            </div>
            <input
              required
              placeholder="ID number"
              value={form.original_spouse_id_number}
              onChange={update("original_spouse_id_number")}
            />
          </div>
        </div>
      </section>

      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Main Member <span className="reg-form__subtitle">(Main Claimant)</span></h3>
        </div>
        <div className="grid grid--2">
          <div className="name-field">
            <span>Main Member</span>
            <div className="name-field__row">
              <TitleSelect value={form.claimant_title} onChange={update("claimant_title")} />
              <input
                required
                placeholder="Full name"
                value={form.claimant_name}
                onChange={update("claimant_name")}
              />
            </div>
            <input
              required
              placeholder="ID number"
              value={form.claimant_id_number}
              onChange={update("claimant_id_number")}
            />
          </div>
          <div className="name-field">
            <span>Spouse</span>
            <div className="name-field__row">
              <TitleSelect
                value={form.claimant_spouse_title}
                onChange={update("claimant_spouse_title")}
                options={["Mr", "Mrs"]}
              />
              <input
                required
                placeholder="Full name"
                value={form.claimant_spouse_name}
                onChange={update("claimant_spouse_name")}
              />
            </div>
            <input
              required
              placeholder="ID number"
              value={form.claimant_spouse_id_number}
              onChange={update("claimant_spouse_id_number")}
            />
          </div>
        </div>
      </section>

      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Contact Details</h3>
        </div>
        <div className="grid grid--2">
          <label>
            Relationship to Odi
            <input required value={form.relationship_to_odi} onChange={update("relationship_to_odi")} />
          </label>
          <label>
            Email
            <input required type="email" value={form.email} onChange={update("email")} />
          </label>
        </div>
      </section>

      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Children</h3>
          <button type="button" className="reg-form__add-btn" onClick={addChildRow}>+ Add child</button>
        </div>
        <div className="reg-table-wrap">
        <table className="reg-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID Number</th>
              <th>Gender</th>
              <th>Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {children.map((child, i) => (
              <tr key={i}>
                <td><input required value={child.name} onChange={updateChild(i, "name")} /></td>
                <td><input required value={child.id_number} onChange={updateChild(i, "id_number")} /></td>
                <td>
                  <select required value={child.gender} onChange={updateChild(i, "gender")}>
                    <option value="">-</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </td>
                <td><input required value={child.contact} onChange={updateChild(i, "contact")} /></td>
                <td>
                  {children.length > 1 && (
                    <button type="button" className="reg-form__remove-btn" onClick={() => removeChildRow(i)} aria-label="Remove child row">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Grandchildren</h3>
          <button type="button" className="reg-form__add-btn" onClick={addGrandchildRow}>+ Add grandchild</button>
        </div>
        <div className="reg-table-wrap">
        <table className="reg-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID Number</th>
              <th>Gender</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {grandchildren.map((gc, i) => (
              <tr key={i}>
                <td><input required value={gc.name} onChange={updateGrandchild(i, "name")} /></td>
                <td><input required value={gc.id_number} onChange={updateGrandchild(i, "id_number")} /></td>
                <td>
                  <select required value={gc.gender} onChange={updateGrandchild(i, "gender")}>
                    <option value="">-</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </td>
                <td>
                  {grandchildren.length > 1 && (
                    <button type="button" className="reg-form__remove-btn" onClick={() => removeGrandchildRow(i)} aria-label="Remove grandchild row">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Origin &amp; Additional Details</h3>
        </div>
        <div className="grid grid--2">
          <label>
            Place of Origin / Ancestral Place of Origin
            <input required value={form.place_of_origin} onChange={update("place_of_origin")} />
          </label>
          <label>
            Business Details / Additional Details
            <input required value={form.business_details} onChange={update("business_details")} />
          </label>
          <label>
            Origin / Ethnicity
            <input required value={form.origin_ethnicity} onChange={update("origin_ethnicity")} />
          </label>
          <label>
            Family Representative
            <input required value={form.family_representative} onChange={update("family_representative")} />
          </label>
          <label>
            Power of Attorney
            <input required value={form.power_of_attorney} onChange={update("power_of_attorney")} />
          </label>
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
