import { useState } from "react";

const EMPTY_FILTERS = {
  status: "",
  kgoro: "",
  section: "",
  zone: "",
  place_of_origin: "",
  origin_ethnicity: "",
  q: "",
  date_from: "",
  date_to: "",
};

export default function FiltersPanel({ onApply, onReset }) {
  const [draft, setDraft] = useState(EMPTY_FILTERS);

  const set = (field) => (e) => setDraft({ ...draft, [field]: e.target.value });

  const handleApply = (e) => {
    e.preventDefault();
    onApply(draft);
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    onReset();
  };

  return (
    <form className="filters-panel" onSubmit={handleApply}>
      <div className="filters-panel__row">
        <label>
          Status
          <select value={draft.status} onChange={set("status")}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>
          Search name / ID
          <input value={draft.q} onChange={set("q")} placeholder="Name or ID number" />
        </label>
        <label>
          Kgoro
          <input value={draft.kgoro} onChange={set("kgoro")} />
        </label>
        <label>
          Section
          <input value={draft.section} onChange={set("section")} />
        </label>
        <label>
          Zone
          <input value={draft.zone} onChange={set("zone")} />
        </label>
        <label>
          Place of Origin / Farm
          <input value={draft.place_of_origin} onChange={set("place_of_origin")} />
        </label>
        <label>
          Origin / Ethnicity
          <input value={draft.origin_ethnicity} onChange={set("origin_ethnicity")} />
        </label>
        <label>
          From date
          <input type="date" value={draft.date_from} onChange={set("date_from")} />
        </label>
        <label>
          To date
          <input type="date" value={draft.date_to} onChange={set("date_to")} />
        </label>
      </div>
      <div className="filters-panel__actions">
        <button type="submit" className="filters-panel__apply">Apply filters</button>
        <button type="button" className="filters-panel__reset" onClick={handleReset}>Reset</button>
      </div>
    </form>
  );
}
