/**
 * Contract analysis APIs (clause cards, review table, playbook, redline, DOCX).
 */

import { apiRequest, getApiBaseUrl, getStoredAccessToken } from "../lib/apiClient";

export async function getQuickActions() {
  return apiRequest("/chat/quick-actions", { method: "GET" });
}

export async function getClauseFields() {
  return apiRequest("/contracts/fields", { method: "GET" });
}

export async function getPlaybooks() {
  return apiRequest("/contracts/playbooks", { method: "GET" });
}

export async function extractClauses(documentId) {
  if (!documentId) throw new Error("documentId is required.");
  return apiRequest(`/contracts/documents/${documentId}/clauses`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function runPlaybookReview(documentId, { playbookId } = {}) {
  if (!documentId) throw new Error("documentId is required.");
  return apiRequest(`/contracts/documents/${documentId}/playbook-review`, {
    method: "POST",
    body: JSON.stringify({
      playbook_id: playbookId || null,
    }),
  });
}

export async function runRedline(
  documentId,
  { againstDocumentId = null, playbookId = null } = {}
) {
  if (!documentId) throw new Error("documentId is required.");
  return apiRequest(`/contracts/documents/${documentId}/redline`, {
    method: "POST",
    body: JSON.stringify({
      against_document_id: againstDocumentId || null,
      playbook_id: playbookId || null,
    }),
  });
}

export async function runReviewTable({
  matterId = null,
  conversationId = null,
  documentIds = null,
  fieldKeys = null,
  extraQuestions = null,
} = {}) {
  const body = {
    field_keys: fieldKeys || null,
    extra_questions: extraQuestions || null,
    document_ids: documentIds || null,
  };

  if (matterId) {
    return apiRequest(`/contracts/matters/${matterId}/review-table`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
  if (conversationId) {
    const query = matterId ? `?matter_id=${encodeURIComponent(matterId)}` : "";
    return apiRequest(
      `/contracts/conversations/${conversationId}/review-table${query}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }
  throw new Error("matterId or conversationId is required for review table.");
}

/**
 * Download a .docx from POST /contracts/export.
 * @param {{
 *   kind: 'clauses'|'playbook'|'redline'|'review_table'|'draft',
 *   documentId?: string,
 *   againstDocumentId?: string,
 *   matterId?: string,
 *   conversationId?: string,
 *   playbookId?: string,
 *   title?: string,
 *   body?: string,
 * }} payload
 */
export async function downloadExport(payload) {
  const body = {
    kind: payload.kind,
    document_id: payload.documentId || null,
    against_document_id: payload.againstDocumentId || null,
    matter_id: payload.matterId || null,
    conversation_id: payload.conversationId || null,
    playbook_id: payload.playbookId || null,
    title: payload.title || null,
    body: payload.body || null,
  };

  const response = await apiRequest("/contracts/export", {
    method: "POST",
    body: JSON.stringify(body),
    raw: true,
  });

  if (!response.ok) {
    let detail = "Export failed.";
    try {
      const json = await response.json();
      detail = json?.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(typeof detail === "string" ? detail : "Export failed.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `${payload.kind || "export"}.docx`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return { filename };
}

/** Prefer camelCase from aliased APIs; fall back to snake_case from SSE. */
export function pickArtifacts(payload = {}) {
  return {
    clauseCards: payload.clauseCards || payload.clause_cards || null,
    reviewTable: payload.reviewTable || payload.review_table || null,
    playbookReview: payload.playbookReview || payload.playbook_review || null,
    redline: payload.redline || null,
  };
}

export function primaryDocumentIdFromArtifacts(artifacts) {
  return (
    artifacts?.clauseCards?.documentId ||
    artifacts?.clauseCards?.document_id ||
    artifacts?.playbookReview?.documentId ||
    artifacts?.playbookReview?.document_id ||
    artifacts?.redline?.leftDocumentId ||
    artifacts?.redline?.left_document_id ||
    artifacts?.reviewTable?.rows?.[0]?.documentId ||
    artifacts?.reviewTable?.rows?.[0]?.document_id ||
    null
  );
}

/** @deprecated kept for accidental imports */
export function getContractsApiOrigin() {
  return getApiBaseUrl();
}

export function hasAuthToken() {
  return Boolean(getStoredAccessToken());
}
