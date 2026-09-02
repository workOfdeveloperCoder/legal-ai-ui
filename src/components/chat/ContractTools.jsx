import { useEffect, useMemo, useState } from "react";
import { FileSearch, GitCompare, LayoutGrid, ListChecks, Loader2 } from "lucide-react";
import {
  extractClauses,
  getPlaybooks,
  pickArtifacts,
  runPlaybookReview,
  runRedline,
  runReviewTable,
} from "../../services/contractsService";

function normalizePlaybooks(data) {
  const items = Array.isArray(data) ? data : data?.items || data?.playbooks || [];
  return items.map((item) => ({
    id: item.id || item.playbookId || item.playbook_id,
    name: item.name || item.title || item.id,
    description: item.description || "",
  })).filter((item) => item.id);
}

function artifactMessage({ kind, label, payload, documentId }) {
  const artifacts = pickArtifacts(payload);
  // Direct API responses are the artifact body itself (not nested under complete).
  if (kind === "clauses" && !artifacts.clauseCards) {
    artifacts.clauseCards = payload;
  }
  if (kind === "playbook" && !artifacts.playbookReview) {
    artifacts.playbookReview = payload;
  }
  if (kind === "redline" && !artifacts.redline) {
    artifacts.redline = payload;
  }
  if (kind === "review_table" && !artifacts.reviewTable) {
    artifacts.reviewTable = payload;
  }

  return {
    id: `contract-tool-${kind}-${Date.now()}`,
    role: "assistant",
    content: label,
    createdAt: new Date().toISOString(),
    status: "complete",
    ...artifacts,
    activeDocumentId: documentId || null,
  };
}

export default function ContractTools({
  documentIds = [],
  matterId = null,
  conversationId = null,
  disabled = false,
  onArtifactMessage,
  onError,
}) {
  const docs = useMemo(
    () =>
      (documentIds || [])
        .map((item) =>
          typeof item === "string"
            ? { id: item, filename: item }
            : { id: item?.id, filename: item?.filename || item?.name || item?.id }
        )
        .filter((item) => item.id),
    [documentIds]
  );

  const [playbooks, setPlaybooks] = useState([]);
  const [documentId, setDocumentId] = useState("");
  const [againstDocumentId, setAgainstDocumentId] = useState("");
  const [playbookId, setPlaybookId] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!docs.length) {
      setDocumentId("");
      return;
    }
    setDocumentId((prev) =>
      docs.some((d) => String(d.id) === String(prev)) ? prev : String(docs[0].id)
    );
  }, [docs]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPlaybooks();
        if (cancelled) return;
        const list = normalizePlaybooks(data);
        setPlaybooks(list);
        if (list.length) {
          setPlaybookId((prev) =>
            list.some((p) => p.id === prev) ? prev : list[0].id
          );
        }
      } catch {
        if (!cancelled) setPlaybooks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!docs.length) return null;

  async function run(kind, runner, label) {
    if (disabled || busy) return;
    setBusy(kind);
    onError?.("");
    try {
      const payload = await runner();
      onArtifactMessage?.(
        artifactMessage({
          kind,
          label,
          payload,
          documentId,
        })
      );
    } catch (err) {
      onError?.(err?.message || `Contract ${kind} failed.`);
    } finally {
      setBusy("");
    }
  }

  const otherDocs = docs.filter((d) => String(d.id) !== String(documentId));

  return (
    <div className="mx-auto mb-3 w-full max-w-5xl rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-slate-600">
          Contract tools
        </span>
        <select
          value={documentId}
          disabled={disabled || Boolean(busy)}
          onChange={(e) => setDocumentId(e.target.value)}
          className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-700 outline-none"
          title="Primary document"
        >
          {docs.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.filename}
            </option>
          ))}
        </select>
        {playbooks.length > 0 && (
          <select
            value={playbookId}
            disabled={disabled || Boolean(busy)}
            onChange={(e) => setPlaybookId(e.target.value)}
            className="max-w-[200px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-700 outline-none"
            title="Playbook"
          >
            {playbooks.map((pb) => (
              <option key={pb.id} value={pb.id}>
                {pb.name}
              </option>
            ))}
          </select>
        )}
        {otherDocs.length > 0 && (
          <select
            value={againstDocumentId}
            disabled={disabled || Boolean(busy)}
            onChange={(e) => setAgainstDocumentId(e.target.value)}
            className="max-w-[200px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-700 outline-none"
            title="Compare against (optional)"
          >
            <option value="">vs playbook</option>
            {otherDocs.map((doc) => (
              <option key={doc.id} value={doc.id}>
                vs {doc.filename}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <ToolButton
          icon={ListChecks}
          label="Extract clauses"
          busy={busy === "clauses"}
          disabled={disabled || Boolean(busy) || !documentId}
          onClick={() =>
            run(
              "clauses",
              () => extractClauses(documentId),
              "Clause extraction complete."
            )
          }
        />
        <ToolButton
          icon={FileSearch}
          label="Playbook review"
          busy={busy === "playbook"}
          disabled={disabled || Boolean(busy) || !documentId}
          onClick={() =>
            run(
              "playbook",
              () =>
                runPlaybookReview(documentId, {
                  playbookId: playbookId || null,
                }),
              "Playbook review complete."
            )
          }
        />
        <ToolButton
          icon={GitCompare}
          label="Redline"
          busy={busy === "redline"}
          disabled={disabled || Boolean(busy) || !documentId}
          onClick={() =>
            run(
              "redline",
              () =>
                runRedline(documentId, {
                  againstDocumentId: againstDocumentId || null,
                  playbookId: againstDocumentId ? null : playbookId || null,
                }),
              "Redline complete."
            )
          }
        />
        <ToolButton
          icon={LayoutGrid}
          label="Review table"
          busy={busy === "review_table"}
          disabled={
            disabled ||
            Boolean(busy) ||
            (!matterId && !conversationId)
          }
          onClick={() =>
            run(
              "review_table",
              () =>
                runReviewTable({
                  matterId,
                  conversationId: matterId ? null : conversationId,
                  documentIds: docs.map((d) => d.id),
                }),
              "Review table complete."
            )
          }
        />
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, label, busy, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Icon size={13} />
      )}
      {label}
    </button>
  );
}
