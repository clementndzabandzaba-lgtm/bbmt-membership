import { useState } from "react";
import RegistrationFormFields from "../RegistrationFormFields";
import DocumentsPanel from "./DocumentsPanel";
import ActivityLog from "./ActivityLog";

const emptyChild = { name: "", id_number: "", gender: "", contact: "" };
const emptyGrandChild = { name: "", id_number: "", gender: "" };

export default function EditRegistrationModal({ registration, token, onCancel, onSave, saving, error }) {
  const [form, setForm] = useState(() => ({ ...registration }));
  const [children, setChildren] = useState(() =>
    registration.children?.length ? registration.children.map((c) => ({ ...c })) : [{ ...emptyChild }]
  );
  const [grandchildren, setGrandchildren] = useState(() =>
    registration.grandchildren?.length ? registration.grandchildren.map((g) => ({ ...g })) : [{ ...emptyGrandChild }]
  );

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
  const removeChildRow = (index) => setChildren(children.filter((_, i) => i !== index));
  const addGrandchildRow = () => setGrandchildren([...grandchildren, { ...emptyGrandChild }]);
  const removeGrandchildRow = (index) => setGrandchildren(grandchildren.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, children, grandchildren });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <h3>
          Edit registration — {registration.membership_number}
          {registration.update_reference && (
            <span className="reg-form__subtitle" style={{ display: "block", marginTop: 4, fontWeight: 500 }}>
              This submission references Membership Number: {registration.update_reference}
            </span>
          )}
        </h3>
        <form onSubmit={handleSubmit}>
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
            requireFields={false}
          />

          <DocumentsPanel registrationId={registration.id} token={token} documents={registration.documents} />

          <ActivityLog registrationId={registration.id} token={token} />

          {error && <p className="reg-form__message reg-form__message--error">⚠ {error}</p>}

          <div className="modal-card__actions" style={{ marginTop: 18 }}>
            <button type="button" className="modal-card__button modal-card__button--ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="modal-card__button" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
