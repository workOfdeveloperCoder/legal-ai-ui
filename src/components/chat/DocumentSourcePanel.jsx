import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { documentService } from "../../services/documentService";

function buildHighlightedParts(fullText, startOffset, endOffset, excerpt) {
  if (
    fullText &&
    Number.isInteger(startOffset) &&
    Number.isInteger(endOffset) &&
    startOffset >= 0 &&
    endOffset > startOffset &&
    endOffset <= fullText.length
  ) {
    return {
      before: fullText.slice(0, startOffset),
      highlight: fullText.slice(startOffset, endOffset),
      after: fullText.slice(endOffset),
    };
  }

  const needle = (excerpt || "").trim();
  if (fullText && needle.length >= 20) {
    const index = fullText.indexOf(needle.slice(0, 80));
    if (index >= 0) {
      const len = Math.min(needle.length, fullText.length - index);
      return {
        before: fullText.slice(0, index),
        highlight: fullText.slice(index, index + len),
        after: fullText.slice(index + len),
      };
    }
  }

  return { before: fullText || "", highlight: "", after: "" };
}

export default function DocumentSourcePanel({
  source,
  matterId,
  conversationId,
  onClose,
}) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(0);
  const highlightRef = useRef(null);

  const title =
    source.displayName || source.title || source.filename || "Document";

  const resolvedConversationId =
    conversationId || source.conversationId || null;
  const resolvedMatterId = matterId || source.matterId || null;

  const evidenceItems =
    source.evidence?.length > 0
      ? source.evidence
      : source.excerpt || source.text
        ? [
            {
              excerpt: source.excerpt,
              text: source.text,
              highlightStart: source.highlightStart,
              highlightEnd: source.highlightEnd,
            },
          ]
        : [];

  const activeEvidence =
    evidenceItems[activeEvidenceIndex] || evidenceItems[0] || null;

  useEffect(() => {
    if (!source.documentId) return undefined;
    if (!resolvedConversationId && !resolvedMatterId) return undefined;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await documentService.getDocument({
          documentId: source.documentId,
          matterId: resolvedMatterId,
          conversationId: resolvedConversationId,
          scope: source.scope,
        });
        if (!cancelled) setDocument(data);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load document.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    source.documentId,
    source.scope,
    resolvedConversationId,
    resolvedMatterId,
  ]);

  const parts = useMemo(
    () =>
      buildHighlightedParts(
        document?.text,
        activeEvidence?.highlightStart,
        activeEvidence?.highlightEnd,
        activeEvidence?.excerpt || activeEvidence?.text
      ),
    [
      document?.text,
      activeEvidence?.highlightStart,
      activeEvidence?.highlightEnd,
      activeEvidence?.excerpt,
      activeEvidence?.text,
    ]
  );

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [document?.text, parts.highlight, activeEvidenceIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">
              {title}
            </p>
            {source.filename && source.filename !== title && (
              <p className="truncate text-sm text-slate-500">{source.filename}</p>
            )}
            {source.author && (
              <p className="mt-1 text-sm text-slate-600">{source.author}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <p className="text-sm text-slate-500">Loading document…</p>
          )}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {!loading && !error && evidenceItems.length > 0 && (
            <div className="mb-4 space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800">
                Retrieved evidence
                {evidenceItems.length > 1
                  ? ` · ${evidenceItems.length} passages`
                  : ""}
              </p>

              {evidenceItems.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {evidenceItems.map((item, index) => (
                    <button
                      key={item.sourceId || index}
                      type="button"
                      onClick={() => setActiveEvidenceIndex(index)}
                      className={`rounded-full px-3 py-1 text-[11px] ${
                        index === activeEvidenceIndex
                          ? "bg-amber-200 text-slate-900"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Passage {index + 1}
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm leading-6 text-slate-800">
                  {activeEvidence?.excerpt || activeEvidence?.text}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && document?.text && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Full document
              </p>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-800">
                {parts.before}
                {parts.highlight ? (
                  <mark
                    ref={highlightRef}
                    className="rounded bg-yellow-200 px-0.5 text-slate-900"
                  >
                    {parts.highlight}
                  </mark>
                ) : null}
                {parts.after}
              </pre>
            </div>
          )}

          {!loading && !error && !document?.text && activeEvidence?.text && (
            <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-sans text-sm leading-6 text-slate-800">
              {activeEvidence.text}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
