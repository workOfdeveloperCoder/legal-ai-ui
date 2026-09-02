import { FileText, ListTree, Scale, Sparkles } from "lucide-react";

const ACTIONS = [
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
    label: "Explain simply",
    icon: Scale,
    quickAction: "summarize_document",
    message:
      "Explain this document in plain language for a non-lawyer. What does it do, who it binds, and what matters most.",
  },
];

export default function DocumentActions({
  documents = [],
  disabled = false,
  onAction,
}) {
  const docs = (documents || []).filter((d) => d?.id);
  if (!docs.length) return null;

  return (
    <div className="mx-auto mb-3 w-full max-w-5xl rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <FileText size={14} className="text-amber-600" />
        <span className="text-[12px] font-medium text-slate-600">
          Documents
        </span>
        <span className="text-[11px] text-slate-400">
          Actions for your latest upload in this chat
        </span>
      </div>

      <div className="space-y-2">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-slate-800">
                {doc.filename || "Document"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      onAction?.({
                        documentId: doc.id,
                        filename: doc.filename,
                        quickAction: action.quickAction,
                        message: action.message,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon size={12} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
