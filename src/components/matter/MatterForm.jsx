import { useState } from "react";
import { matterService } from "../../services/matterService";

export default function MatterForm({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nextHearing, setNextHearing] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await matterService.createMatter(title.trim(), undefined, nextHearing, description.trim() || null);
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Could not create matter. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "w-full rounded-xl border border-slate-300 bg-white/70 px-4 py-3 outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20";
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="matter-title" className="mb-2 block text-sm font-medium">Matter title</label>
        <input id="matter-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={255} placeholder="Enter matter title" className={fieldClass} />
      </div>
      <div>
        <label htmlFor="matter-description" className="mb-2 block text-sm font-medium">Description <span className="font-normal text-slate-500">(optional)</span></label>
        <textarea id="matter-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={2000} placeholder="Add a short note about this matter" className={`${fieldClass} resize-y`} />
      </div>
      <div>
        <label htmlFor="matter-hearing" className="mb-2 block text-sm font-medium">Next hearing <span className="font-normal text-slate-500">(optional)</span></label>
        <input id="matter-hearing" type="date" value={nextHearing} onChange={(event) => setNextHearing(event.target.value)} className={fieldClass} />
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 bg-white/60 px-5 py-2 text-sm hover:bg-white disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={saving || !title.trim()} className="primary-action rounded-xl px-5 py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-60">{saving ? "Creating…" : "Create matter"}</button>
      </div>
    </form>
  );
}
