/**
 * Dashboard data from legal-chatbot APIs.
 * Mock json-server is optional fallback only.
 */

import { apiRequest } from "../lib/apiClient";
import { chatService } from "./chatService";
import { getQuickActions } from "./contractsService";
import { matterService } from "./matterService";

const MOCK_API = import.meta.env.VITE_MOCK_API_URL || "";

const DEFAULT_QUICK_ACTIONS = [
  {
    id: "new-chat",
    title: "New Chat",
    description: "Ask a legal research question",
    icon: "MessageSquare",
    href: "/dashboard",
  },
  {
    id: "new-matter",
    title: "Matters",
    description: "Open your case files",
    icon: "Folder",
    href: "/matters",
  },
  {
    id: "documents",
    title: "Documents",
    description: "Upload files on a matter",
    icon: "FileText",
    href: "/matters",
  },
];

function formatRelative(value) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const delta = Date.now() - date.getTime();
    const minutes = Math.round(delta / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function mapActivity(item) {
  return {
    id: String(item.id),
    title: item.summary || item.action || "Activity",
    description: item.action || "",
    time: formatRelative(item.created_at),
  };
}

function mapChatQuickActions(payload) {
  const list = payload?.quickActions || payload?.quick_actions || [];
  return list.map((item) => ({
    id: item.slug || item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    icon: item.icon || "Sparkles",
    prompt: item.prompt,
    enablesWebSearch: item.enablesWebSearch ?? item.enables_web_search ?? false,
    requiresDocument: item.requiresDocument ?? item.requires_document ?? false,
  }));
}

async function loadFromBackend() {
  const [matters, conversations, activityPayload, quickActionsPayload] =
    await Promise.all([
      matterService.getMatters().catch(() => []),
      chatService.getConversations({ refresh: true }).catch(() => []),
      apiRequest("/logs/activities?limit=20", { method: "GET" }).catch(() => ({
        items: [],
      })),
      getQuickActions().catch(() => null),
    ]);

  const activityItems = Array.isArray(activityPayload)
    ? activityPayload
    : activityPayload?.items || [];

  const conversationActivity = (conversations || []).slice(0, 8).map((conversation) => ({
    id: `conversation-${conversation.id}`,
    title: conversation.title || "Conversation",
    description: conversation.lastMessage || conversation.matter?.title || "",
    time: conversation.updatedAt || "",
  }));

  const chatQuickActions = mapChatQuickActions(quickActionsPayload);

  return {
    welcome: null,
    startChat: null,
    quickActions:
      chatQuickActions.length > 0 ? chatQuickActions : DEFAULT_QUICK_ACTIONS,
    recentActivity:
      activityItems.length > 0
        ? activityItems.map(mapActivity)
        : conversationActivity,
    matters: (matters || []).map((matter) => ({
      id: matter.id,
      title: matter.title,
      lastMessage: matter.description || matter.lastMessage || "",
      nextHearing: matter.nextHearing || null,
    })),
    calendar: [],
    tasks: [],
  };
}

export const dashboardService = {
  async getDashboard() {
    try {
      return await loadFromBackend();
    } catch (error) {
      console.error("Failed to load dashboard from Legal Chatbot:", error);
    }

    if (!MOCK_API) return null;

    try {
      const response = await fetch(`${MOCK_API}/dashboard`);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },
};
