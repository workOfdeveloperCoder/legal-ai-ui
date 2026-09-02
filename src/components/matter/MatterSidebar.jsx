import { FileText, ListTree, Scale, Sparkles, Trash2 } from "lucide-react";

const DOC_ACTIONS = [
  {
    id: "summarize",
    label: "Summarize",
    icon: Sparkles,
    quickAction: "summarize_document",
    message:
      "Summarize this document. Cover the purpose, key parties, main points, and any legal issues raised.",
  },
  {
    id: "key_issues",
    label: "Key issues",
    icon: ListTree,
    quickAction: "summarize_document",
    message:
      "From this document, list the key legal and factual issues, obligations, deadlines, and risks in clear bullet points.",
  },
  {
    id: "explain",
    label: "Explain",
    icon: Scale,
    quickAction: "summarize_document",
    message:
      "Explain this document in plain language for a non-lawyer. What does it do, who it binds, and what matters most.",
  },
];

export default function MatterSidebar({
  documents = [],
  onDeleteDocument,
  onDocumentAction,
  deletingId = null,
  actionBusy = false,
}) {
  return (
    <aside className="w-[320px] border-l border-[#ECECEC] bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-[#202124]">
          Documents
        </h3>
        <span className="text-[12px] text-[#7B8190]">
          {documents.length}
        </span>
      </div>

      {documents.length === 0 ? (
        <p className="text-[13px] text-[#7B8190]">
          Upload files to this matter, then summarize or ask about them.
        </p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-[#ECECEC] bg-[#FCFAF6] p-3"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF3DA]">
                  <FileText size={14} className="text-[#D39A1F]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#202124]">
                    {doc.filename || "Document"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7B8190]">
                    {doc.readyForQa
                      ? "Ready for Q&A"
                      : doc.processed
                        ? "Indexing…"
                        : "Processing…"}
                  </p>
                </div>
                {onDeleteDocument && (
                  <button
                    type="button"
                    disabled={deletingId === doc.id || actionBusy}
                    onClick={() => onDeleteDocument(doc)}
                    title="Delete document"
                    className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {onDocumentAction && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DOC_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        disabled={actionBusy || !doc.readyForQa}
                        title={
                          doc.readyForQa
                            ? action.label
                            : "Wait until the document is ready"
                        }
                        onClick={() =>
                          onDocumentAction({
                            document: doc,
                            quickAction: action.quickAction,
                            message: action.message,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon size={11} />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
