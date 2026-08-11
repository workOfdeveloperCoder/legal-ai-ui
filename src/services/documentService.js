/**
 * Document upload — legal-chatbot:
 * POST /api/v1/documents/{matter_id}/upload
 * multipart field name: `file`
 */

import { apiRequest } from "../lib/apiClient";

export const documentService = {
  /**
   * @param {string} matterId
   * @param {File} file
   */
  async uploadToMatter(matterId, file) {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest(`/documents/${matterId}/upload`, {
      method: "POST",
      body: formData,
    });
  },
};
