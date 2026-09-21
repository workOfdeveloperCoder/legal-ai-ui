import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { idsForDocumentGet, resolveDocumentGetPath } from "../../lib/documentFetch";
import { reflowDocumentText } from "../../lib/reflowDocumentText";
import { documentService } from "../../services/documentService";

/**
 * One resource click → one full Qdrant-merged readable file.
 * No passage tabs, no yellow highlight — just the compiled document.
 */
export default function DocumentSourcePanel({
  source,
  matterId,
  conversationId,
  onClose,
}) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");

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

  useEffect(() => {
    if (!documentGetPath) {
      setDocument(null);
      setErrorNotice(
        "This resource has no full-document endpoint. Open a library or uploaded file."
      );
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorNotice("");
      try {
        const data = await documentService.getDocument(fetchIds);
        if (cancelled) return;
        setDocument(data);
        if (!data?.text) {
          setErrorNotice("Full document text is not available for this resource.");
        }
      } catch (err) {
        if (!cancelled) {
          setDocument(null);
          setErrorNotice(
            err?.message || "Could not load the full document for this resource."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    documentGetPath,
    fetchIds.documentId,
    fetchIds.conversationId,
    fetchIds.matterId,
    fetchIds.sourceType,
    fetchIds.scope,
  ]);

  const displayText = useMemo(
    () => reflowDocumentText(document?.text || ""),
    [document?.text]
  );

  const filename = document?.filename || source.filename;

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
            {document?.character_count != null && (
              <p className="mt-1 text-xs text-slate-400">
                Full file · {Number(document.character_count).toLocaleString()}{" "}
                chars
                {document.chunk_count != null
                  ? ` · ${document.chunk_count} chunks merged`
                  : ""}
              </p>
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
            <p className="text-sm text-slate-500">
              Loading full document from all chunks…
            </p>
          )}

          {!loading && errorNotice && !displayText && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {errorNotice}
            </p>
          )}

          {!loading && displayText && (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-800">
              {displayText}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
