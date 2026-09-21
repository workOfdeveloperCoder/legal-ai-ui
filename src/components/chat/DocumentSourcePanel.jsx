import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { idsForDocumentGet, resolveDocumentGetPath } from "../../lib/documentFetch";
import {
  buildHighlightedPartsFromExcerpts,
  mergeEvidenceTexts,
} from "../../lib/highlightSentences";
import { reflowDocumentText } from "../../lib/reflowDocumentText";
import { documentService } from "../../services/documentService";

export default function DocumentSourcePanel({
  source,
  matterId,
  conversationId,
  onClose,
}) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fullTextNotice, setFullTextNotice] = useState("");
  const highlightRef = useRef(null);

  const title =
    document?.display_name ||
    source.displayName ||
    source.title ||
    source.filename ||
    "Document";

  const fetchIds = idsForDocumentGet({
    source,
    conversationId,
    matterId,
  });
  const documentGetPath = resolveDocumentGetPath(fetchIds);

  const evidenceItems = useMemo(() => {
    if (source.evidence?.length > 0) return source.evidence;
    if (source.excerpt || source.text) {
      return [
        {
          excerpt: source.excerpt,
          text: source.text,
          highlightStart: source.highlightStart,
          highlightEnd: source.highlightEnd,
        },
      ];
    }
    return [];
  }, [
    source.evidence,
    source.excerpt,
    source.text,
    source.highlightStart,
    source.highlightEnd,
  ]);

  // One combined passage for the whole resource (no Passage 1 / 2 tabs).
  const combinedEvidenceText = useMemo(
    () => mergeEvidenceTexts(evidenceItems),
    [evidenceItems]
  );

  useEffect(() => {
    if (!documentGetPath) {
      setDocument(null);
      setFullTextNotice("");
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setFullTextNotice("");
      try {
        const data = await documentService.getDocument(fetchIds);
        if (cancelled) return;
        setDocument(data);
        if (!data?.text) {
          setFullTextNotice(
            "Full document text is not available. Showing the retrieved passage."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setDocument(null);
          setFullTextNotice(
            err?.message ||
              "Full document text is not available. Showing the retrieved passage."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentGetPath, fetchIds.documentId, fetchIds.conversationId, fetchIds.matterId, fetchIds.sourceType, fetchIds.scope]);

  const fullText = document?.text || "";
  const displayText = useMemo(
    () => reflowDocumentText(fullText),
    [fullText]
  );

  const parts = useMemo(
    () =>
      buildHighlightedPartsFromExcerpts(
        displayText,
        evidenceItems.length
          ? evidenceItems
          : combinedEvidenceText
            ? [{ excerpt: combinedEvidenceText }]
            : []
      ),
    [displayText, evidenceItems, combinedEvidenceText]
  );

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [displayText, parts.highlight]);

  const filename = document?.filename || source.filename;
  const evidenceDisplay = reflowDocumentText(
    combinedEvidenceText || source.excerpt || source.text || ""
  );

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
            {filename && filename !== title && (
              <p className="truncate text-sm text-slate-500">{filename}</p>
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

          {!loading && fullTextNotice && !document?.text && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {fullTextNotice}
            </p>
          )}

          {!loading && evidenceDisplay && (
            <div className="mb-4 space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800">
                Retrieved evidence
                {evidenceItems.length > 1 ? " · combined" : ""}
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {evidenceDisplay}
                </p>
              </div>
            </div>
          )}

          {!loading && displayText && (
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

          {!loading && !displayText && evidenceDisplay && (
            <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-sans text-sm leading-6 text-slate-800">
              {evidenceDisplay}
            </pre>
          )}

          {!loading && !displayText && !evidenceDisplay && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {fullTextNotice || "This resource has no document text to show."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
