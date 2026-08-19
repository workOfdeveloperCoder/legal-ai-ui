/**
 * Document upload — legal-chatbot:
 * POST /api/v1/documents/conversations/{conversation_id}/upload
 * POST /api/v1/documents/matters/{matter_id}/upload
 * multipart field name: `file`
 *
 * Supported extract types: application/pdf, text/*
 * Max size: 25MB
 */

import { apiRequest } from "../lib/apiClient";

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
};
