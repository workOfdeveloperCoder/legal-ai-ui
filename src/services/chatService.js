/**
 * Chat integration for legal-chatbot.
 *
 * Real API:
 *   POST /api/v1/chat
 *   body: { matter_id?, conversation_id?, message }
 *   response: { conversation_id, response, citations[] }
 *
 * No streaming. Conversation list/history HTTP APIs are not exposed by the
 * backend yet — local cache bridges that gap for this browser session.
 */

import { apiRequest } from "../lib/apiClient";
import { getStoredUser } from "../lib/apiClient";
import {
  getCachedConversation,
  listCachedConversations,
  replaceCachedConversationId,
  saveCachedDetail,
  upsertCachedConversation,
} from "../lib/conversationStore";

function currentUserId() {
  return getStoredUser()?.id || "anonymous";
}

function createId(prefix = "msg") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mapCitationsToSources(citations = []) {
  return citations.map((citation, index) => {
    const title =
      citation.title ||
      citation.law_name ||
      citation.filename ||
      citation.document_type ||
      "Legal source";

    const metaParts = [];
    if (citation.law_name && citation.law_name !== title) {
      metaParts.push(citation.law_name);
    }
    if (citation.document_type) metaParts.push(citation.document_type);
    if (citation.court) metaParts.push(citation.court);
    if (citation.year) metaParts.push(String(citation.year));
    if (citation.jurisdiction) metaParts.push(citation.jurisdiction);
    if (citation.practice_area) metaParts.push(citation.practice_area);
    if (citation.category) metaParts.push(citation.category);

    return {
      id: citation.id || `source-${index}`,
      documentId: citation.document_id,
      title,
      heading: citation.heading || null,
      meta: metaParts.join(" · ") || undefined,
      sections: citation.sections || [],
      section:
        citation.sections?.length > 0
          ? citation.sections.slice(0, 6).join(", ")
          : undefined,
      excerpt: citation.excerpt || null,
      summary: citation.summary || null,
      filename: citation.filename || null,
      lawName: citation.law_name || null,
      documentType: citation.document_type || null,
      category: citation.category || null,
      keywords: citation.keywords || [],
      score: citation.score,
      raw: citation,
    };
  });
}

function emptyDetail(id, matter = null) {
  return {
    id,
    conversationId: id,
    title: "New Conversation",
    matter,
    messages: [],
    model: "legal-chatbot",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const chatService = {
  async getConversations() {
    return listCachedConversations(currentUserId());
  },

  async getConversation(conversationId) {
    const cached = getCachedConversation(currentUserId(), conversationId);
    if (cached) return cached;

    // Draft / unknown id — return an empty shell so the prompt still works.
    return emptyDetail(conversationId);
  },

  async getAvailableConversations(matterId) {
    const conversations = await this.getConversations();

    if (!matterId) return conversations;

    const hasMatter = conversations.some(
      (conversation) => conversation.matter?.id === String(matterId)
    );

    if (!hasMatter) return conversations;

    return conversations.filter(
      (conversation) => conversation.matter?.id !== String(matterId)
    );
  },

  /**
   * Create a local draft conversation. The backend creates the real
   * conversation on the first POST /chat (when conversation_id is omitted).
   */
  async createConversation({ matter = null } = {}) {
    const id = createId("draft");
    const detail = emptyDetail(id, matter);
    const meta = {
      id,
      title: "New Conversation",
      lastMessage: "",
      updatedAt: "Just now",
      matter,
      isDraft: true,
    };

    upsertCachedConversation(currentUserId(), meta, detail);
    return meta;
  },

  /**
   * Send a message to POST /api/v1/chat.
   * @param {string} conversationId
   * @param {string} message
   * @param {{ matterId?: string|null, signal?: AbortSignal }} [options]
   */
  async sendMessage(conversationId, message, options = {}) {
    const { matterId = null, signal } = options;
    const userId = currentUserId();
    const isDraft = String(conversationId).startsWith("draft-");

    let detail =
      getCachedConversation(userId, conversationId) ||
      emptyDetail(conversationId);

    const userMessage = {
      id: createId("user"),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    detail = {
      ...detail,
      messages: [...(detail.messages || []), userMessage],
      updatedAt: new Date().toISOString(),
    };

    const titleFromMessage =
      message.length > 40 ? `${message.substring(0, 40)}...` : message;

    const isFirstMessage =
      (detail.messages?.filter((m) => m.role === "user").length || 0) <= 1;

    upsertCachedConversation(
      userId,
      {
        id: conversationId,
        title: isFirstMessage ? titleFromMessage : detail.title,
        lastMessage: message,
        updatedAt: "Just now",
        matter: detail.matter || (matterId ? { id: matterId } : null),
        isDraft,
      },
      detail
    );

    const payload = {
      message,
      conversation_id: isDraft ? null : conversationId,
      matter_id: matterId || detail.matter?.id || null,
    };

    try {
      const response = await apiRequest("/chat", {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
      });

      const realId = String(response.conversation_id);
      const sources = mapCitationsToSources(response.citations);

      const assistantMessage = {
        id: createId("assistant"),
        role: "assistant",
        content: response.response,
        sources,
        createdAt: new Date().toISOString(),
      };

      const confirmedUserMessage = {
        ...userMessage,
        status: "sent",
      };

      const nextDetail = {
        ...detail,
        id: realId,
        conversationId: realId,
        title: isFirstMessage ? titleFromMessage : detail.title || titleFromMessage,
        matter: detail.matter || (matterId ? { id: matterId } : null),
        messages: [
          ...(detail.messages || []).slice(0, -1),
          confirmedUserMessage,
          assistantMessage,
        ],
        updatedAt: new Date().toISOString(),
      };

      const nextMeta = {
        id: realId,
        title: nextDetail.title,
        lastMessage: message,
        updatedAt: "Just now",
        matter: nextDetail.matter,
        isDraft: false,
      };

      if (isDraft || String(conversationId) !== realId) {
        replaceCachedConversationId(
          userId,
          conversationId,
          realId,
          nextMeta,
          nextDetail
        );
      } else {
        upsertCachedConversation(userId, nextMeta, nextDetail);
      }

      return nextDetail;
    } catch (error) {
      if (error?.name === "AbortError") {
        const abortedDetail = {
          ...detail,
          messages: (detail.messages || []).map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, status: "aborted" }
              : msg
          ),
        };
        saveCachedDetail(userId, conversationId, abortedDetail);
        throw error;
      }

      const failedDetail = {
        ...detail,
        messages: (detail.messages || []).map((msg) =>
          msg.id === userMessage.id
            ? {
                ...msg,
                status: "error",
                error:
                  error?.message ||
                  "Failed to get a response from Legal Chatbot.",
              }
            : msg
        ),
      };

      saveCachedDetail(userId, conversationId, failedDetail);
      throw error;
    }
  },
};
