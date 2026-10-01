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
import { documentService } from "./documentService";

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

function mapMatter(matter, agenda = []) {
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
    tasks: agenda.filter((item) => String(item.matter_id) === String(matter.id) && item.kind === "task"),
    updatedAt: formatRelative(matter.updated_at) || "Just now",
    nextHearing: agenda.filter((item) => String(item.matter_id) === String(matter.id) && item.kind === "hearing" && item.status !== "cancelled" && item.due_at).sort((a, b) => new Date(a.due_at) - new Date(b.due_at))[0]?.due_at || null,
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

    const [data, agendaPayload] = await Promise.all([
      apiRequest("/matters", { method: "GET" }),
      apiRequest("/work-items", { method: "GET" }).catch(() => ({ items: [] })),
    ]);
    await conversationsPromise;

    const items = Array.isArray(data) ? data : data?.items || [];
    const agenda = agendaPayload?.items || [];
    const matters = items.map((item) => mapMatter(item, agenda));
     
    const withDocs = await Promise.all(
      matters.map(async (matter) =>{
          try{
            const documents = await documentService.getMatterDocuments(matter.id);
            return { ...matter, documents };
          }catch{
            return { ...matter,documents: []};
          }
      })
    ); 
    return withDocs;
  },

  async getMatter(id) {
    try {
      await chatService.getConversations({ refresh: true });
    } catch {
      // Matter detail still loads if conversation sync fails.
    }
    const [matter, agendaPayload] = await Promise.all([
      apiRequest(`/matters/${id}`, { method: "GET" }),
      apiRequest("/work-items", { method: "GET" }).catch(() => ({ items: [] })),
    ]);
    const mapped = mapMatter(matter, agendaPayload?.items || []);

    try{
      const documents = await documentService.getMatterDocuments(id);
      return { ...mapped, documents };
    }catch{
      return { ...mapped, documents: []};
    }
  },

  async getMatterConversations(matterId) {
    const data = await apiRequest(`/matters/${matterId}/conversations`, {
      method: "GET",
    });
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map((item) => mapMatterConversation(item, matterId));
  },

  async createMatter(title, _model, nextHearing, description = null) {
    const matter = await apiRequest("/matters", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
      }),
    });
    const mapped = mapMatter(matter);
    if (nextHearing) {
      try {
        await apiRequest("/work-items", {
          method: "POST",
          body: JSON.stringify({
            matter_id: matter.id,
            kind: "hearing",
            title: "Hearing",
            due_at: new Date(nextHearing).toISOString(),
          }),
        });
        mapped.nextHearing = new Date(nextHearing).toISOString();
      } catch (error) {
        // Matter creation has already committed; report the partial result
        // without encouraging a duplicate matter retry.
        mapped.warning = `Matter created, but the hearing could not be scheduled: ${error?.message || "request failed"}`;
      }
    }
    return mapped;
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
