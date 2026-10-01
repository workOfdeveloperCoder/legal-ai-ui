import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import MatterHeader from "./MatterHeader";
import MatterConversationCards from "./MatterConversationCards";
import { matterService } from "../../services/matterService";
import { chatService } from "../../services/chatService";
import { documentService } from "../../services/documentService";
import { workspaceService } from "../../services/workspaceService";
import { CalendarDays, CheckSquare, Plus, Trash2, FileText, Eye } from "lucide-react";
import DocumentSourcePanel from "../chat/DocumentSourcePanel";

function describeApiError(error, action) {
  if (error?.status >= 500) {
    return `${action} failed (HTTP ${error.status}). Check the backend logs and apply any pending database migrations.`;
  }
  return error?.message || `${action} failed.`;
}

export default function Matter() {
  const { matterId } = useParams();
  const navigate = useNavigate();
  const [matter, setMatter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workItems, setWorkItems] = useState([]);
  const [itemKind, setItemKind] = useState("task");
  const [itemTitle, setItemTitle] = useState("");
  const [itemDue, setItemDue] = useState("");
  const [itemBusy, setItemBusy] = useState(false);
  const [itemError, setItemError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);

  async function loadWorkItems() {
    try { const data = await workspaceService.workItems(); setWorkItems((data?.items || []).filter((item) => String(item.matter_id) === String(matterId))); setItemError(""); }
    catch (err) { setWorkItems([]); setItemError(describeApiError(err, "Loading the matter agenda")); }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadMatter() {
      if (!matterId) return;
      setLoading(true);
      setError("");

      try {
        const matterData = await matterService.getMatter(matterId);
        if (!cancelled) setMatter(matterData);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Failed to load matter.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMatter();
    return () => {
      cancelled = true;
    };
  }, [matterId]);

  useEffect(() => {
    let active = true;
    workspaceService.workItems()
      .then((data) => {
        if (active) setWorkItems((data?.items || []).filter((item) => String(item.matter_id) === String(matterId)));
      })
      .catch((err) => { if (active) { setWorkItems([]); setItemError(describeApiError(err, "Loading the matter agenda")); } });
    return () => { active = false; };
  }, [matterId]);

  async function createWorkItem(event) {
    event.preventDefault();
    if (!itemTitle.trim()) return;
    setItemBusy(true);
    setItemError("");
    try {
      await workspaceService.createWorkItem({ matter_id: matterId, kind: itemKind, title: itemTitle.trim(), due_at: itemDue ? new Date(itemDue).toISOString() : null });
      setItemTitle(""); setItemDue(""); await loadWorkItems();
    } catch (err) { setItemError(describeApiError(err, "Saving this agenda item")); }
    finally { setItemBusy(false); }
  }

  async function toggleWorkItem(item) {
    setItemError("");
    try {
      await workspaceService.updateWorkItem(item.id, { status: item.status === "done" ? "open" : "done" });
      await loadWorkItems();
    } catch (err) { setItemError(describeApiError(err, "Updating this agenda item")); }
  }

  async function removeWorkItem(item) {
    if (!window.confirm(`Remove “${item.title}” from this matter agenda?`)) return;
    setItemError("");
    try {
      await workspaceService.deleteWorkItem(item.id);
      await loadWorkItems();
    } catch (err) { setItemError(describeApiError(err, "Removing this agenda item")); }
  }

  async function removeDocument(document) {
    if (!window.confirm(`Delete “${document.filename}” from this matter?`)) return;
    setDocumentError("");
    try {
      await documentService.deleteMatterDocument(matterId, document.id);
      await loadDocuments();
    } catch (err) { setDocumentError(err?.message || "Could not delete this document."); }
  }

  const handleListLoaded = useCallback((conversations) => {
    setMatter((prev) => (prev ? { ...prev, conversations } : prev));
  }, []);

  async function handleNewChat() {
    if (!matter) return;
    try {
      const created = await chatService.createConversation({ matter: { id: matter.id, title: matter.title } });
      const realId = await chatService.ensureServerConversation(created.id, {
        title: `${matter.title} chat`, matter: { id: matter.id, title: matter.title },
      });
      navigate(`/conversation/${realId}`);
    } catch (err) { setError(err?.message || "Could not create a chat for this matter."); }
  }

  async function loadDocuments() {
    if (!matterId) return;
    try {
      const docs = await documentService.getMatterDocuments(matterId);
      setMatter((prev) => (prev ? { ...prev, documents: docs } : prev));
      setDocumentError("");
    } catch (err) {
      setDocumentError(err?.message || "Could not load matter documents.");
    }
  }

  useEffect(() => {
    let active = true;
    if (matterId) {
      documentService.getMatterDocuments(matterId)
        .then((documents) => { if (active) setMatter((prev) => prev ? { ...prev, documents } : prev); })
        .catch((err) => { if (active) setDocumentError(err?.message || "Could not load matter documents."); });
    }
    return () => { active = false; };
  }, [matterId]);

  async function handleUploaded() {
    await loadDocuments();
  }

  function handleMatterUpdated(updated) {
    setMatter((prev) =>
      prev
        ? {
            ...prev,
            ...updated,
            documents: prev.documents,
            conversations: prev.conversations,
            tasks: prev.tasks,
            nextHearing: prev.nextHearing,
          }
        : updated
    );
  }

  function handleMatterDeleted() {
    navigate("/matters");
  }

  function handleSelectConversation(id) {
    navigate(`/conversation/${id}`);
  }

  return (
    <div className="matter-page-glass flex h-full min-h-0">
      <div className="flex min-h-0 flex-1 flex-col">
        <MatterHeader
          matter={matter ? { ...matter, tasks: workItems.filter((item) => item.kind === "task"), nextHearing: workItems.find((item) => item.kind === "hearing" && item.due_at && item.status !== "cancelled")?.due_at || null } : matter}
          matterId={matterId}
          onNewChat={handleNewChat}
          onUploaded={handleUploaded}
          onMatterUpdated={handleMatterUpdated}
          onMatterDeleted={handleMatterDeleted}
        />

        <div className="matter-detail-layout">
          {error ? (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Loading matter…
            </div>
          ) : (
            <>
            <main className="matter-main-column">
            <section className="matter-content-glass mb-6 rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Matter agenda</h2><p className="mt-1 text-sm text-slate-500">Track case tasks and hearing dates for this matter.</p></div></div>
              <form onSubmit={createWorkItem} className="grid gap-3 xl:grid-cols-[140px_minmax(180px,1fr)_190px_auto]">
                <select aria-label="Agenda item type" value={itemKind} onChange={(event) => setItemKind(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="task">Task</option><option value="hearing">Hearing</option></select>
                <input value={itemTitle} onChange={(event) => setItemTitle(event.target.value)} placeholder={itemKind === "hearing" ? "Hearing title" : "Task title"} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
                <input type="datetime-local" aria-label="Due date and time" value={itemDue} onChange={(event) => setItemDue(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <button disabled={itemBusy} className="primary-action flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"><Plus size={16}/> {itemBusy ? "Saving…" : "Add"}</button>
              </form>
              {itemError && <p role="alert" className="mt-3 rounded-lg bg-rose-50/80 px-3 py-2 text-sm text-rose-700">{itemError}</p>}
              {workItems.length > 0 && <div className="mt-4 divide-y divide-slate-200/60">{workItems.map((item) => <div key={item.id} className="flex items-center gap-3 py-3"><span className="rounded-lg bg-[#EAF3FF]/80 p-2 text-[#007AFF]">{item.kind === "hearing" ? <CalendarDays size={16}/> : <CheckSquare size={16}/>}</span><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${item.status === "done" ? "text-slate-400 line-through" : "text-slate-800"}`}>{item.title}</p><p className="text-xs capitalize text-slate-500">{item.kind}{item.due_at ? ` · ${new Date(item.due_at).toLocaleString()}` : ""}</p></div>{item.kind === "task" && <button type="button" onClick={() => void toggleWorkItem(item)} className="rounded-lg px-3 py-1.5 text-xs text-[#0066CC] hover:bg-[#EAF3FF]">{item.status === "done" ? "Reopen" : "Complete"}</button>}<button type="button" onClick={() => void removeWorkItem(item)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${item.title}`}><Trash2 size={15}/></button></div>)}</div>}
            </section>
            <MatterConversationCards
              matterId={matterId}
              matterTitle={matter?.title}
              onSelectConversation={handleSelectConversation}
              onListLoaded={handleListLoaded}
            />
            </main>
            <aside className="matter-documents-rail hide-scrollbar" aria-label="Matter documents">
              <section className="matter-content-glass rounded-2xl border p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Documents</h2><p className="mt-1 text-sm text-slate-500">Files uploaded to this matter are available across its chats.</p></div><span className="shrink-0 rounded-full bg-[#EAF3FF]/80 px-3 py-1 text-xs font-medium text-[#0066CC]">{matter?.documents?.length || 0}</span></div>
                {documentError && <p role="alert" className="mb-3 rounded-lg bg-rose-50/80 px-3 py-2 text-sm text-rose-700">{documentError}</p>}
                {(matter?.documents || []).length ? <div className="divide-y divide-slate-200/60">{matter.documents.map((document) => <div key={document.id} className="flex items-center gap-2 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF3FF]/80 text-[#007AFF]"><FileText size={17}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{document.filename}</p><p className="text-xs text-slate-500">{document.processed ? "Ready" : "Processing"}{document.characterCount ? ` · ${document.characterCount.toLocaleString()} characters` : ""}</p></div><button type="button" onClick={() => setSelectedDocument({ documentId: document.id, sourceType: "matter", matterId, filename: document.filename, title: document.filename })} className="rounded-lg p-2 text-[#007AFF] hover:bg-[#EAF3FF]" aria-label={`View ${document.filename}`}><Eye size={17}/></button><button type="button" onClick={() => void removeDocument(document)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${document.filename}`}><Trash2 size={16}/></button></div>)}</div> : <div className="rounded-xl border border-dashed border-slate-300/80 bg-white/35 px-4 py-6 text-center text-sm text-slate-500">No documents yet. Use Upload above to add a PDF or text file.</div>}
              </section>
            </aside>
            </>
          )}
        </div>
      </div>
      {selectedDocument && <DocumentSourcePanel source={selectedDocument} matterId={matterId} onClose={() => setSelectedDocument(null)} />}
    </div>
  );
}
