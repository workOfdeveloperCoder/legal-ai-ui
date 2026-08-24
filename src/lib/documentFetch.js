/**
 * legal-chatbot document GETs used by the resource modal:
 *   GET /api/v1/documents/conversations/{conversation_id}/document/{document_id}
 *   GET /api/v1/matters/{matter_id}/document/{document_id}
 *   GET /api/v1/matters/{matter_id}/documents
 *
 * There is no library/legal corpus full-text endpoint. Those cards
 * must render retrieved `evidence[]` instead of fetching.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  if (!value) return false;
  return UUID_RE.test(String(value).trim());
}

export function normalizeSourceType(value) {
  const type = String(value || "").trim().toLowerCase();
  if (type === "legal") return "library";
  return type || "";
}

export function idsForDocumentGet({
  source = {},
  conversationId = null,
  matterId = null,
} = {}) {
  const sourceType = normalizeSourceType(source.sourceType || source.scope);

  const conversationIdForFetch =
    source.conversationId ||
    (sourceType === "conversation" ? conversationId : null) ||
    null;

  const matterIdForFetch =
    source.matterId ||
    (sourceType === "matter" ? matterId : null) ||
    null;

  return {
    documentId: source.documentId || null,
    sourceType: source.sourceType || source.scope || null,
    scope: source.scope || null,
    conversationId: conversationIdForFetch,
    matterId: matterIdForFetch,
  };
}

/**
 * @returns {string|null} path under `/api/v1`, or null when the backend
 * has no GET for this resource (library/legal, missing UUIDs, drafts).
 */
export function resolveDocumentGetPath({
  documentId,
  matterId,
  conversationId,
  scope,
  sourceType,
} = {}) {
  const docId = String(documentId || "").trim();
  if (!isUuid(docId)) return null;

  const type = normalizeSourceType(sourceType || scope);

  if (type === "library") {
    return null;
  }

  const convId = isUuid(conversationId) ? String(conversationId).trim() : null;
  const matId = isUuid(matterId) ? String(matterId).trim() : null;

  if (type === "conversation") {
    return convId
      ? `/documents/conversations/${convId}/document/${docId}`
      : null;
  }

  if (type === "matter") {
    return matId ? `/matters/${matId}/document/${docId}` : null;
  }

  if (convId && !matId) {
    return `/documents/conversations/${convId}/document/${docId}`;
  }

  if (matId) {
    return `/matters/${matId}/document/${docId}`;
  }

  if (convId) {
    return `/documents/conversations/${convId}/document/${docId}`;
  }

  return null;
}
