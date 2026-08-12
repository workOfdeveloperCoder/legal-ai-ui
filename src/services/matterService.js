/**
 * Matters API — legal-chatbot contracts:
 * POST   /api/v1/matters
 * GET    /api/v1/matters          → { items: MatterResponse[] }
 * GET    /api/v1/matters/{id}
 * GET    /api/v1/matters/{id}/conversations
 * PATCH  /api/v1/matters/{id}
 * DELETE /api/v1/matters/{id}
 *
 * Mapped into the shapes expected by existing legal-ai-ui matter cards.
 */

import { apiRequest, getStoredUser } from "../lib/apiClient";
import { listCachedConversations } from "../lib/conversationStore";
import { chatService } from "./chatService";

function formatRelative(iso) {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function mapMatterConversation(item, matterId) {
  return {
    id: String(item.id),
    title: item.title || "New Conversation",
    lastMessage: item.last_message || item.lastMessage || "",
    updatedAt: item.last_message_at || item.updated_at || item.updatedAt,
    matter: {
      id: String(matterId),
      title: item.matter_title || null,
    },
    isDraft: false,
    isPinned: Boolean(item.is_pinned),
  };
}

function mapMatter(matter) {
  const userId = getStoredUser()?.id;
  const linkedConversations = listCachedConversations(userId).filter(
    (conversation) =>
      conversation.matter?.id &&
      String(conversation.matter.id) === String(matter.id)
  );

  return {
    id: matter.id,
    title: matter.title,
    description: matter.description,
    color: matter.color,
    icon: matter.icon,
    status: matter.status,
    isPinned: matter.is_pinned,
    lastMessage: matter.description || "",
    conversations: linkedConversations,
    documents: [],
    tasks: [],
    updatedAt: formatRelative(matter.updated_at) || "Just now",
    nextHearing: null,
    createdAt: matter.created_at,
    lastOpenedAt: matter.last_opened_at,
    raw: matter,
  };
}

export const matterService = {
  async getMatters() {
    const conversationsPromise = chatService
      .getConversations({ refresh: true })
      .catch(() => {});

    const data = await apiRequest("/matters", { method: "GET" });
    await conversationsPromise;

    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(mapMatter);
  },

  async getMatter(id) {
    try {
      await chatService.getConversations({ refresh: true });
    } catch {
      // Matter detail still loads if conversation sync fails.
    }
    const matter = await apiRequest(`/matters/${id}`, { method: "GET" });
    return mapMatter(matter);
  },

  async getMatterConversations(matterId) {
    const data = await apiRequest(`/matters/${matterId}/conversations`, {
      method: "GET",
    });
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map((item) => mapMatterConversation(item, matterId));
  },

  async createMatter(title, _model, _nextHearing, description = null) {
    const matter = await apiRequest("/matters", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
      }),
    });
    return mapMatter(matter);
  },

  async updateMatter(id, payload) {
    const body = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.description !== undefined) {
      body.description = payload.description;
    }
    if (payload.color !== undefined) body.color = payload.color;
    if (payload.icon !== undefined) body.icon = payload.icon;
    if (payload.isPinned !== undefined) body.is_pinned = payload.isPinned;
    if (payload.status !== undefined) body.status = payload.status;

    const matter = await apiRequest(`/matters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return mapMatter(matter);
  },

  async deleteMatter(id) {
    await apiRequest(`/matters/${id}`, { method: "DELETE" });
  },

  async getAvailableMatters(conversationId) {
    const matters = await this.getMatters();
    return matters.filter((matter) => {
      const exists = matter.conversations?.some(
        (conversation) =>
          String(conversation.id) === String(conversationId)
      );
      return !exists;
    });
  },
};
