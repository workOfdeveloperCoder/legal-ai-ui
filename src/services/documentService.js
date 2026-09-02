/**
 * Document upload and GET — legal-chatbot:
 * POST /api/v1/documents/conversations/{conversation_id}/upload
 * POST /api/v1/documents/matters/{matter_id}/upload
 * GET  /api/v1/documents/conversations/{conversation_id}/document/{document_id}
 * GET  /api/v1/matters/{matter_id}/document/{document_id}
 * GET  /api/v1/matters/{matter_id}/documents
 * multipart field name: `file`
 *
 * Supported extract types: application/pdf, text/*
 * Max size: 25MB
 */

import { apiRequest } from "../lib/apiClient";
import { resolveDocumentGetPath } from "../lib/documentFetch";

export const ACCEPTED_UPLOAD_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  ".pdf",
  ".txt",
  ".md",
  ".csv",
].join(",");

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function isAllowedUploadFile(file) {
  if (!file) return false;
  if (file.size > MAX_UPLOAD_BYTES) return false;
  const type = file.type || "";
  const name = (file.name || "").toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return true;
  if (type.startsWith("text/")) return true;
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv")) {
    return true;
  }
  return false;
}

async function uploadFile(path, file) {
  if (!isAllowedUploadFile(file)) {
    throw new Error(
      `"${file?.name || "File"}" is not supported. Use PDF or text files under 25MB.`
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  return apiRequest(path, {
    method: "POST",
    body: formData,
  });
}

export const documentService = {
  /** Link document to a conversation only. */
  async uploadToConversation(conversationId, file) {
    if (!conversationId) {
      throw new Error("A conversation is required to upload documents.");
    }
    return uploadFile(
      `/documents/conversations/${conversationId}/upload`,
      file
    );
  },

  async uploadManyToConversation(conversationId, files = []) {
    const uploaded = [];
    for (const file of files) {
      uploaded.push(await this.uploadToConversation(conversationId, file));
    }
    return uploaded;
  },

  /** Link document to a matter (shared across matter chats). */
  async uploadToMatter(matterId, file) {
    if (!matterId) {
      throw new Error("A matter is required to upload documents.");
    }
    return uploadFile(`/documents/matters/${matterId}/upload`, file);
  },

  async uploadManyToMatter(matterId, files = []) {
    const uploaded = [];
    for (const file of files) {
      uploaded.push(await this.uploadToMatter(matterId, file));
    }
    return uploaded;
  },

  /**
   * Full merged text for a conversation- or matter-scoped upload.
   * Returns null when the backend has no GET for this resource
   * (library/legal corpus, draft ids, or missing UUIDs).
   */
  async getDocument({
    documentId,
    matterId,
    conversationId,
    scope,
    sourceType,
  } = {}) {
    const path = resolveDocumentGetPath({
      documentId,
      matterId,
      conversationId,
      scope,
      sourceType,
    });
    if (!path) return null;
    return apiRequest(path, { method: "GET" });
  },

  /** Summary rows for the matter document library (no full text). */
  async getMatterDocuments(matterId) {
    if (!matterId) return [];
    const data = await apiRequest(`/matters/${matterId}/documents`, {
      method: "GET",
    });
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map((item) => ({
      id: item.id,
      filename: item.filename,
      type: item.type || "document",
      scope: item.scope,
      matterId: item.matter_id,
      mimeType: item.mime_type,
      textPreview: item.text_preview,
      characterCount: item.character_count ?? 0,
      processed: item.processed,
      vectorized: item.vectorized,
      readyForQa: item.ready_for_qa,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  },

  async deleteMatterDocument(matterId, documentId) {
    if (!matterId || !documentId) {
      throw new Error("matterId and documentId are required.");
    }
    await apiRequest(`/matters/${matterId}/document/${documentId}`, {
      method: "DELETE",
    });
    return { id: String(documentId) };
  },
};
