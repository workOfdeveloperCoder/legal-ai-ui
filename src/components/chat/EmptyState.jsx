import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Scale } from "lucide-react";

import { getQuickActions } from "../../services/contractsService";

const FALLBACK_ACTIONS = [
  {
    id: 1,
    slug: "draft_document",
    title: "Draft the Document",
    description: "Create any legal document",
    icon: "FilePlus",
    prompt:
      "Help me draft a legal document. Ask what type I need (notice, plaint, petition, affidavit, contract, or other), the parties, the material facts, and the relief sought, then draft it in professional Pakistani legal form.",
  },
  {
    id: 2,
    slug: "find_authorities",
    title: "Find Legal Authorities",
    description: "Search cases, laws and more",
    icon: "Scale",
    prompt:
      "Find the governing Pakistani legal authorities for my issue. Search statutes, rules, and case law, and cite what you find.",
  },
  {
    id: 3,
    slug: "summarize_document",
    title: "Summarize Document",
    description: "Get key points in seconds",
    icon: "FilePenLine",
    prompt:
      "Summarize the uploaded document. Give the key points, parties or author position, and any legal issues it raises. If no document is attached, ask me to upload one.",
    requiresDocument: true,
  },
  {
    id: 4,
    slug: "analyze_contract",
    title: "Review a Document",
    description: "Risks, obligations, and takeaways",
    icon: "FileCog",
    prompt:
      "Review the uploaded document. Explain the material terms, obligations, risks, and practical takeaways under Pakistani law in clear prose. If no document is attached, ask me to upload one.",
    requiresDocument: true,
  },
  {
    id: 5,
    slug: "prepare_hearing",
    title: "Prepare for Hearing",
    description: "Build arguments and notes",
    icon: "Gavel",
    prompt:
      "Help me prepare for a hearing. Build a structured note with the issues, facts to prove, supporting authorities, likely objections, and oral submissions. Ask for the forum, stage, and my client's position if those are missing.",
  },
  {
    id: 6,
    slug: "compare_provisions",
    title: "Compare Legal Provisions",
    description: "Compare laws side by side",
    icon: "Landmark",
    prompt:
      "Compare the legal provisions I name side by side. Explain overlap, differences, which provision prevails, and how a Pakistani court would apply them.",
  },
];

function ActionCard({ action, onSelect, compact = false }) {
  const Icon = Icons[action.icon] || Scale;

  return (
    <button
      type="button"
      onClick={() => onSelect(action)}
      className={`rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
        compact ? "px-3 py-2.5" : "p-4"
      }`}
    >
      <div className={`flex ${compact ? "items-center gap-2.5" : "items-start gap-3"}`}>
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl bg-yellow/30 text-slate-800 ${
            compact ? "h-8 w-8" : "h-10 w-10"
          }`}
        >
          <Icon size={compact ? 16 : 18} />
        </div>
        <div className="min-w-0">
          <p
            className={`font-semibold text-slate-900 ${
              compact ? "text-[13px]" : "text-[14px]"
            }`}
          >
            {action.title}
          </p>
          <p
            className={`mt-0.5 text-slate-500 ${
              compact ? "text-[11px] leading-4" : "text-[12px] leading-5"
            }`}
          >
            {action.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function EmptyState({ onSelectAction = null }) {
  const [actions, setActions] = useState(FALLBACK_ACTIONS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getQuickActions();
        const list = data?.quickActions || data?.quick_actions || [];
        if (!cancelled && list.length) {
          const hidden = new Set([
            "review_table",
            "playbook_review",
            "redline",
          ]);
          setActions(
            list
              .filter((item) => !hidden.has(item.slug))
              .map((item) => ({
                id: item.id,
                slug: item.slug,
                title:
                  item.slug === "analyze_contract"
                    ? "Review a Document"
                    : item.title,
                description:
                  item.slug === "analyze_contract"
                    ? "Risks, obligations, and takeaways"
                    : item.description,
                icon: item.icon,
                prompt:
                  item.slug === "analyze_contract"
                    ? "Review the uploaded document. Explain the material terms, obligations, risks, and practical takeaways under Pakistani law in clear prose. If no document is attached, ask me to upload one."
                    : item.prompt,
                requiresDocument:
                  item.requiresDocument ?? item.requires_document ?? false,
                enablesWebSearch:
                  item.enablesWebSearch ?? item.enables_web_search ?? false,
              }))
          );
        }
      } catch {
        // Keep fallback cards offline.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelect(action) {
    if (!onSelectAction) return;
    onSelectAction({
      message: action.prompt || action.title,
      quickAction: action.slug,
      webSearch: Boolean(action.enablesWebSearch),
    });
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center px-6 py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow shadow-lg">
        <Scale size={28} className="text-slate-900" />
      </div>

      <h1 className="mt-6 text-3xl font-bold text-slate-900">
        Pakistan Legal AI
      </h1>

      <p className="mt-2 max-w-xl text-center text-[15px] text-slate-500">
        Ask any Pakistani law question — statutes, procedure, bail, drafting,
        or your matter. Upload documents when you have them; without files you
        still get an answer marked as general guidance.
      </p>

      <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <ActionCard
            key={action.slug || action.id}
            action={action}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
