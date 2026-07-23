export const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev"];

export function TitleSelect({ label, value, onChange, options = TITLE_OPTIONS, required = true }) {
  return (
    <select value={value || ""} onChange={onChange} aria-label={label} required={required}>
      <option value="">Title</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

/**
 * Shared field set rendered by both the public registration form and the
 * admin edit modal. `requireFields` controls whether the always-required
 * fields (name/ID/kgoro etc.) get the HTML `required` attribute — the admin
 * edit flow always passes false since it may be correcting a partially
 * filled record. Spouse, child contact, and business details are optional
 * in both contexts.
 */
export default function RegistrationFormFields({
  form,
  update,
  childrenList,
  updateChild,
  addChildRow,
  removeChildRow,
  grandchildren,
  updateGrandchild,
  addGrandchildRow,
  removeGrandchildRow,
  requireFields = true,
}) {
  const req = requireFields;

  return (
    <>
      <section className="reg-form__section">
        <div className="reg-form__section-header">
          <h3>Registration Details</h3>
        </div>
        <div className="grid grid--3">
          <label>
            Kgoro
            <input required={req} value={form.kgoro || ""} onChange={update("kgoro")} />
          </label>
          <label>
            Mokgomane
            <input required={req} value={form.mokgomane || ""} onChange={update("mokgomane")} />
          </label>
          <label>
            Section
            <input required={req} value={form.section || ""} onChange={update("section")} />
          </label>
          <label>
            Receipt Number
            <input required={req} value={form.receipt_number || ""} onChange={update("receipt_number")} />
          </label>
          <label>
            Reference No
            <input required={req} value={form.reference_no || ""} onChange={update("reference_no")} />
          </label>
          <label>
            Stand No
            <input required={req} value={form.stand_no || ""} onChange={update("stand_no")} />
          </label>
          <label>
            Zone
            <input required={req} value={form.zone || ""} onChange={update("zone")} />
          </label>
          <label>
            Membership Number <span className="field-optional-tag">Only if updating existing details</span>
            <input
              placeholder="e.g. BBMT-000045"
              value={form.update_reference || ""}
              onChange={update("update_reference")}
            />
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
              <TitleSelect value={form.original_member_title} onChange={update("original_member_title")} required={req} />
              <input
                required={req}
                placeholder="Full name"
                value={form.original_member_name || ""}
                onChange={update("original_member_name")}
              />
            </div>
            <input
              required={req}
              placeholder="ID number (13 digits)"
              maxLength={13}
              inputMode="numeric"
              value={form.original_member_id_number || ""}
              onChange={update("original_member_id_number")}
            />
          </div>
          <div className="name-field">
            <span>Spouse <span className="field-optional-tag">Optional</span></span>
            <div className="name-field__row">
              <TitleSelect
                value={form.original_spouse_title}
                onChange={update("original_spouse_title")}
                required={false}
              />
              <input
                placeholder="Full name"
                value={form.original_spouse_name || ""}
                onChange={update("original_spouse_name")}
              />
            </div>
            <input
              placeholder="ID number (13 digits)"
              maxLength={13}
              inputMode="numeric"
              value={form.original_spouse_id_number || ""}
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
              <TitleSelect value={form.claimant_title} onChange={update("claimant_title")} required={req} />
              <input
                required={req}
                placeholder="Full name"
                value={form.claimant_name || ""}
                onChange={update("claimant_name")}
              />
            </div>
            <input
              required={req}
              placeholder="ID number (13 digits)"
              maxLength={13}
              inputMode="numeric"
              value={form.claimant_id_number || ""}
              onChange={update("claimant_id_number")}
            />
          </div>
          <div className="name-field">
            <span>Spouse <span className="field-optional-tag">Optional</span></span>
            <div className="name-field__row">
              <TitleSelect
                value={form.claimant_spouse_title}
                onChange={update("claimant_spouse_title")}
                required={false}
              />
              <input
                placeholder="Full name"
                value={form.claimant_spouse_name || ""}
                onChange={update("claimant_spouse_name")}
              />
            </div>
            <input
              placeholder="ID number (13 digits)"
              maxLength={13}
              inputMode="numeric"
              value={form.claimant_spouse_id_number || ""}
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
            <input required={req} value={form.relationship_to_odi || ""} onChange={update("relationship_to_odi")} />
          </label>
          <label>
            Email
            <input required={req} type="email" value={form.email || ""} onChange={update("email")} />
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
                <th>Contact <span className="field-optional-tag">Optional</span></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {childrenList.map((child, i) => (
                <tr key={i}>
                  <td><input required={req} value={child.name || ""} onChange={updateChild(i, "name")} /></td>
                  <td><input required={req} value={child.id_number || ""} onChange={updateChild(i, "id_number")} /></td>
                  <td>
                    <select required={req} value={child.gender || ""} onChange={updateChild(i, "gender")}>
                      <option value="">-</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </td>
                  <td><input value={child.contact || ""} onChange={updateChild(i, "contact")} /></td>
                  <td>
                    {childrenList.length > 1 && (
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
                  <td><input required={req} value={gc.name || ""} onChange={updateGrandchild(i, "name")} /></td>
                  <td><input required={req} value={gc.id_number || ""} onChange={updateGrandchild(i, "id_number")} /></td>
                  <td>
                    <select required={req} value={gc.gender || ""} onChange={updateGrandchild(i, "gender")}>
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
            <input required={req} value={form.place_of_origin || ""} onChange={update("place_of_origin")} />
          </label>
          <label>
            Business Details / Additional Details <span className="field-optional-tag">Optional</span>
            <input value={form.business_details || ""} onChange={update("business_details")} />
          </label>
          <label>
            Origin / Ethnicity
            <input required={req} value={form.origin_ethnicity || ""} onChange={update("origin_ethnicity")} />
          </label>
          <label>
            Family Representative
            <input required={req} value={form.family_representative || ""} onChange={update("family_representative")} />
          </label>
          <label>
            Power of Attorney
            <select required={req} value={form.power_of_attorney || ""} onChange={update("power_of_attorney")}>
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>
        </div>
      </section>
    </>
  );
}
