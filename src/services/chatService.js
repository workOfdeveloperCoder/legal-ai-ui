/**
 * Chat integration for legal-chatbot.
 *
 * Real APIs:
 *   POST /api/v1/chat
 *   GET  /api/v1/conversations
 *   GET  /api/v1/conversations/{id}
 *
 * Local draft conversations (before first message) still use localStorage.
 * Server conversations sync across devices for the same user.
 */

import { apiRequest } from "../lib/apiClient";
import { getStoredUser } from "../lib/apiClient";
import {
  getCachedConversation,
  listCachedConversations,
  replaceCachedConversationId,
  replaceConversationList,
  saveCachedDetail,
  upsertCachedConversation,
} from "../lib/conversationStore";

function currentUserId() {
  return getStoredUser()?.id || "anonymous";
}

/** Fetch list from API at most once per session unless refresh=true. */
let conversationsSyncedForUser = null;
let conversationsInFlight = null;

export function resetConversationSyncState() {
  conversationsSyncedForUser = null;
  conversationsInFlight = null;
}

function createId(prefix = "msg") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isDraftId(id) {
  return String(id).startsWith("draft-");
}

function formatUpdatedAt(value) {
  if (!value) return "Just now";
  try {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}

function uniquePreserve(values = []) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    if (value == null) continue;
    const marker = String(value).trim().toLowerCase();
    if (!marker || seen.has(marker)) continue;
    seen.add(marker);
    out.push(value);
  }
  return out;
}

function citationMergeKey(citation) {
  const filename = (citation?.filename || "").trim().toLowerCase();
  if (filename) return `file:${filename}`;
  if (citation?.document_id) return `doc:${citation.document_id}`;
  return `chunk:${citation?.id || citation?.excerpt || Math.random()}`;
}

/**
 * Multiple retrieved chunks often share one filename.
 * Collapse them into a single Resources entry for the UI.
 */
function mergeCitationsByFile(citations = []) {
  const merged = new Map();

  for (const citation of citations) {
    if (!citation) continue;
    const key = citationMergeKey(citation);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...citation,
        sections: [...(citation.sections || [])],
        keywords: [...(citation.keywords || [])],
        _excerpts: citation.excerpt || citation.content
          ? [citation.excerpt || citation.content]
          : [],
      });
      continue;
    }

    const nextScore = Number(citation.score || 0);
    const prevScore = Number(existing.score || 0);
    if (nextScore > prevScore) {
      existing.score = citation.score;
      existing.id = citation.id || existing.id;
    }

    const excerpt = citation.excerpt || citation.content;
    if (excerpt && !existing._excerpts.includes(excerpt)) {
      existing._excerpts.push(excerpt);
    }

    existing.sections = uniquePreserve([
      ...(existing.sections || []),
      ...(citation.sections || []),
    ]);
    existing.keywords = uniquePreserve([
      ...(existing.keywords || []),
      ...(citation.keywords || []),
    ]).slice(0, 12);

    for (const field of [
      "document_id",
      "filename",
      "title",
      "heading",
      "law_name",
      "document_type",
      "category",
      "sub_category",
      "practice_area",
      "court",
      "year",
      "jurisdiction",
      "summary",
    ]) {
      if (
        (existing[field] == null || existing[field] === "") &&
        citation[field] != null &&
        citation[field] !== ""
      ) {
        existing[field] = citation[field];
      }
    }
  }

  return Array.from(merged.values())
    .map((item) => {
      const excerpt =
        item._excerpts?.length > 0 ? item._excerpts.join(" … ") : item.excerpt;
      const { _excerpts, ...citation } = item;
      return { ...citation, excerpt, content: excerpt };
    })
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

function cleanAnswerText(text) {
  if (!text) return "";
  let cleaned = text.trim();

  cleaned = cleaned.replace(
    /\n+\s*(?:#{1,3}\s*)?(?:Sources?|References?|Citations?)\s*:?\s*(?:\n\s*(?:[-*•]\s*)?(?:\[[^\]]*\]|\([^\)]*\)|[^\n]*))*\s*$/i,
    ""
  );
  cleaned = cleaned.replace(
    /\n+\s*(?:#{1,3}\s*)?(?:Sources?|References?|Citations?)\s*:?\s*\n(?:\s*(?:[-*•]\s*)?(?:\[[^\]]*\]|\([^\)]*\)|[^\S\n]*)\s*\n?)+/gi,
    ""
  );
  cleaned = cleaned.replace(
    /\n+\s*(?:#{1,3}\s*)?(?:Sources?|References?|Citations?)\s*:?\s*(?:\n\s*[-*•]\s*)*\s*$/i,
    ""
  );
  cleaned = cleaned.replace(
    /\s*\[Sources?\s+\d+(?:\s*(?:,|and|&)\s*(?:Source\s+)?\d+)+\]/gi,
    ""
  );
  cleaned = cleaned.replace(
    /\s*\(Sources?\s+\d+(?:\s*(?:,|and|&)\s*(?:Source\s+)?\d+)*\)/gi,
    ""
  );
  cleaned = cleaned.replace(/\s*\[Source\s+\d+\]/gi, "");
  cleaned = cleaned.replace(
    /(?:^|\n)\s*(?:#{1,3}\s*)?(?:Sources?|References?|Citations?)\s*:?\s*$/gim,
    ""
  );
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  cleaned = cleaned.replace(/\s+([.,;:])/g, "$1");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}

function normalizeDocumentId(documentId) {
  if (!documentId) return null;
  const value = String(documentId).trim().toLowerCase();
  if (!value) return null;

  const hex = value.replace(/[^0-9a-f]/g, "");
  if (hex.length === 32) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return value;
}

function recoverDocumentId(documentId, chunkId) {
  const normalized = normalizeDocumentId(documentId);
  if (normalized) return normalized;
  if (!chunkId) return null;

  const match = String(chunkId)
    .trim()
    .match(
      /^([0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12})(?::|\/|$)/
    );
  return match ? normalizeDocumentId(match[1]) : null;
}

function normalizeFilename(filename) {
  if (!filename) return null;
  const value = String(filename).trim().toLowerCase();
  return value || null;
}

function resourceMergeKey(resource) {
  // HARD INVARIANT: one document_id = one resource.
  // Same filename + different document_id remain separate.
  const docId = normalizeDocumentId(resource.documentId);
  if (docId) return `doc:${docId}`;
  return resource.id || `resource-${Math.random()}`;
}

function normalizePassageText(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .replace(/[‑–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function passagesAreNearDuplicates(left, right) {
  const a = normalizePassageText(left);
  const b = normalizePassageText(right);
  if (!a || !b) return false;
  if (a === b) return true;

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length < 60) return longer.includes(shorter);

  const prefix = shorter.slice(0, Math.min(180, shorter.length));
  if (longer.startsWith(prefix) || longer.includes(prefix)) {
    const leftTokens = new Set(shorter.split(" "));
    const rightTokens = new Set(longer.split(" "));
    let intersection = 0;
    for (const token of leftTokens) {
      if (rightTokens.has(token)) intersection += 1;
    }
    const union = new Set([...leftTokens, ...rightTokens]).size;
    return union > 0 ? intersection / union >= 0.82 : false;
  }
  return false;
}

function offsetsOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  if (
    leftStart == null ||
    leftEnd == null ||
    rightStart == null ||
    rightEnd == null
  ) {
    return false;
  }
  if (leftEnd <= leftStart || rightEnd <= rightStart) return false;
  const overlap = Math.max(
    0,
    Math.min(leftEnd, rightEnd) - Math.max(leftStart, rightStart)
  );
  if (overlap <= 0) return false;
  const shorter = Math.min(leftEnd - leftStart, rightEnd - rightStart);
  return overlap / shorter >= 0.55;
}

function dedupeEvidence(evidence = []) {
  if (evidence.length <= 1) return evidence;

  const ranked = [...evidence].sort(
    (a, b) => (b.relevancePercent || 0) - (a.relevancePercent || 0)
  );
  const kept = [];

  for (const item of ranked) {
    const duplicate = kept.some(
      (existing) =>
        offsetsOverlap(
          existing.highlightStart,
          existing.highlightEnd,
          item.highlightStart,
          item.highlightEnd
        ) ||
        passagesAreNearDuplicates(
          existing.text || existing.excerpt,
          item.text || item.excerpt
        )
    );
    if (!duplicate) kept.push(item);
  }

  const keptSet = new Set(kept);
  return ranked.filter((item) => keptSet.has(item));
}

function dedupeResources(resources = []) {
  const merged = new Map();

  for (const resource of resources) {
    const key = resourceMergeKey(resource);
    const docId = normalizeDocumentId(resource.documentId);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...resource,
        id: docId ? `resource-${docId}` : resource.id,
        documentId: docId || resource.documentId,
        evidence: [...(resource.evidence || [])],
        evidenceCount: (resource.evidence || []).length,
      });
      continue;
    }

    const seen = new Set(
      (existing.evidence || []).map(
        (item) => `${item.chunkId || item.sourceId || item.excerpt || ""}`
      )
    );

    for (const item of resource.evidence || []) {
      const itemKey = `${item.chunkId || item.sourceId || item.excerpt || ""}`;
      if (!seen.has(itemKey)) {
        existing.evidence.push(item);
        seen.add(itemKey);
      }
    }

    existing.evidenceCount = existing.evidence.length;

    const nextRel = resource.relevancePercent || 0;
    const prevRel = existing.relevancePercent || 0;
    if (nextRel > prevRel) {
      existing.relevancePercent = resource.relevancePercent;
      existing.excerpt = resource.excerpt || existing.excerpt;
      if (docId) {
        existing.documentId = docId;
        existing.id = `resource-${docId}`;
        existing.clickable = true;
      }
    }

    if (!existing.filename && resource.filename) {
      existing.filename = resource.filename;
    }
    if (!existing.displayName && resource.displayName) {
      existing.displayName = resource.displayName;
      existing.title = resource.displayName || existing.title;
    }

    existing.evidence = dedupeEvidence(existing.evidence);
    existing.evidenceCount = existing.evidence.length;
  }

  return [...merged.values()]
    .map((resource) => {
      const evidence = dedupeEvidence(resource.evidence || []);
      return {
        ...resource,
        evidence,
        evidenceCount: evidence.length,
        excerpt: resource.excerpt || evidence[0]?.excerpt || null,
      };
    })
    .sort((a, b) => (b.relevancePercent || 0) - (a.relevancePercent || 0));
}

function mapApiResourcesToUi(resources = []) {
  const mapped = resources.map((resource, index) => {
    const documentId =
      recoverDocumentId(resource.document_id, resource.evidence?.[0]?.chunk_id) ||
      normalizeDocumentId(resource.document_id);

    const title =
      resource.display_name ||
      resource.filename ||
      resource.law_name ||
      "Document";

    const metaParts = [];
    if (resource.author) metaParts.push(resource.author);
    if (resource.law_name && resource.law_name !== title) {
      metaParts.push(resource.law_name);
    }
    if (resource.court) metaParts.push(resource.court);
    if (resource.year) metaParts.push(String(resource.year));

    const evidence = dedupeEvidence(
      (resource.evidence || []).map((item) => ({
      sourceId: item.source_id,
      sourceNumber: item.source_number,
      chunkId: item.chunk_id,
      chunkIndex: item.chunk_index,
      excerpt: item.excerpt,
      text: item.text,
      highlightStart: item.start_offset ?? null,
      highlightEnd: item.end_offset ?? null,
      relevancePercent: item.relevance_percent ?? null,
    }))
    );

    const primaryEvidence = evidence[0] || null;

    return {
      id: documentId
        ? `resource-${documentId}`
        : resource.id || `resource-${index}`,
      documentId: documentId || resource.document_id || null,
      title,
      displayName: resource.display_name || null,
      author: resource.author || null,
      meta: metaParts.join(" · ") || undefined,
      excerpt: resource.primary_excerpt || primaryEvidence?.excerpt || null,
      filename: resource.filename || null,
      relevancePercent: resource.relevance_percent ?? null,
      matterId: resource.matter_id || null,
      conversationId: resource.conversation_id || null,
      sourceType: resource.source_type || null,
      scope:
        resource.source_type === "conversation" || resource.conversation_id
          ? "conversation"
          : resource.matter_id
            ? "matter"
            : null,
      evidence,
      evidenceCount: evidence.length,
      highlightStart: primaryEvidence?.highlightStart ?? null,
      highlightEnd: primaryEvidence?.highlightEnd ?? null,
      text: primaryEvidence?.text || null,
      clickable: Boolean(documentId || resource.document_id),
      raw: resource,
    };
  });

  return dedupeResources(mapped);
}

function buildResourcesFromLegacySources(response) {
  if (!Array.isArray(response.sources) || response.sources.length === 0) {
    return mapCitationsToSources(response.citations);
  }

  const grouped = new Map();

  for (const source of response.sources) {
    const docId = recoverDocumentId(source.document_id, source.chunk_id);
    const chunkKey = source.chunk_id || source.id;
    const key = docId || `chunk:${chunkKey}`;
    const bucket = grouped.get(key) || [];
    bucket.push(source);
    grouped.set(key, bucket);
  }

  return dedupeResources(
    [...grouped.entries()].map(([key, items]) => {
      const primary = items[0];
      const best = [...items].sort(
        (a, b) => Number(b.relevance || b.score || 0) - Number(a.relevance || a.score || 0)
      )[0];
      const docId = recoverDocumentId(best.document_id, best.chunk_id);
      const title =
        best.display_name ||
        best.document_name ||
        best.filename ||
        "Document";

      const evidence = items.map((item) => ({
        sourceId: item.id,
        sourceNumber: item.source_number,
        chunkId: item.chunk_id,
        chunkIndex: item.chunk_index,
        excerpt: item.excerpt || item.text,
        text: item.text,
        highlightStart: item.start_offset ?? null,
        highlightEnd: item.end_offset ?? null,
        relevancePercent: item.relevance_percent ?? null,
      }));

      return {
        id: docId ? `resource-${docId}` : `resource-${key}`,
        documentId: docId || best.document_id,
        title,
        displayName: best.display_name || null,
        filename: best.filename || null,
        excerpt: best.excerpt || evidence[0]?.excerpt || null,
        relevancePercent: best.relevance_percent ?? null,
        matterId: best.matter_id || null,
        conversationId: best.conversation_id || null,
        sourceType: best.source_type || null,
        scope:
          best.source_type === "conversation" || best.conversation_id
            ? "conversation"
            : best.matter_id
              ? "matter"
              : null,
        evidence,
        evidenceCount: evidence.length,
        highlightStart: evidence[0]?.highlightStart ?? null,
        highlightEnd: evidence[0]?.highlightEnd ?? null,
        clickable: Boolean(docId || best.document_id),
        raw: best,
      };
    })
  );
}

function resolveResources(response) {
  // resources[] is the ONLY card source for current API responses.
  // Fall back to sources/citations only for legacy cached messages
  // that predate the resources field.
  if (Object.prototype.hasOwnProperty.call(response, "resources")) {
    return mapApiResourcesToUi(
      Array.isArray(response.resources) ? response.resources : []
    );
  }
  return buildResourcesFromLegacySources(response);
}

function mapApiSourcesToUi(sources = []) {
  const mapped = sources.map((source, index) => {
    const title =
      source.display_name ||
      source.document_name ||
      source.filename ||
      source.law_name ||
      "Legal source";

    const metaParts = [];
    if (source.author) metaParts.push(source.author);
    if (source.section) metaParts.push(source.section);
    if (source.law_name && source.law_name !== title) {
      metaParts.push(source.law_name);
    }
    if (source.court) metaParts.push(source.court);
    if (source.year) metaParts.push(String(source.year));

    return {
      id: source.id || `source-${index}`,
      sourceNumber: source.source_number ?? index + 1,
      documentId: source.document_id,
      title,
      displayName: source.display_name || null,
      author: source.author || null,
      meta: metaParts.join(" · ") || undefined,
      sections: source.sections || [],
      section:
        source.section ||
        (source.sections?.length
          ? source.sections.slice(0, 6).join(", ")
          : undefined),
      excerpt: source.excerpt || source.text || null,
      text: source.text || source.excerpt || null,
      filename: source.filename || null,
      highlightStart: source.start_offset ?? null,
      highlightEnd: source.end_offset ?? null,
      score: source.relevance ?? source.score,
      relevancePercent:
        source.relevance_percent ??
        (typeof source.relevance === "number"
          ? Math.round(Math.min(Math.max(source.relevance, 0), 1) * 100)
          : null),
      matterId: source.matter_id || null,
      conversationId: source.conversation_id || null,
      sourceType: source.source_type || null,
      scope:
        source.source_type === "conversation" || source.conversation_id
          ? "conversation"
          : source.matter_id
            ? "matter"
            : null,
      clickable: Boolean(source.document_id),
      raw: source,
    };
  });

  return mapped;
}

function resolveSources(response) {
  if (Array.isArray(response.sources) && response.sources.length > 0) {
    return mapApiSourcesToUi(response.sources);
  }
  return mapCitationsToSources(response.citations);
}

function mapCitationsToSources(citations = []) {
  return mergeCitationsByFile(citations).map((citation, index) => {
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
      excerpt: citation.excerpt || citation.content || null,
      content: citation.content || citation.excerpt || null,
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

function mapServerListItem(item) {
  const id = String(item.id);
  return {
    id,
    title: item.title || "New Conversation",
    lastMessage: item.last_message || "",
    updatedAt: formatUpdatedAt(item.last_message_at || item.updated_at),
    matter: item.matter_id
      ? {
          id: String(item.matter_id),
          title: item.matter_title || null,
        }
      : null,
    isDraft: false,
    isPinned: Boolean(item.is_pinned),
  };
}

function mapServerDetail(data) {
  const id = String(data.id);
  const matter = data.matter_id
    ? {
        id: String(data.matter_id),
        title: data.matter_title || null,
      }
    : null;

  const messages = (data.messages || []).map((message) => ({
    id: String(message.id),
    role: String(message.role).toLowerCase(),
    content: message.content,
    createdAt: message.created_at,
    sources: [],
  }));

  return {
    id,
    conversationId: id,
    title: data.title || "New Conversation",
    matter,
    messages,
    model: "legal-chatbot",
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.last_message_at,
    isPinned: Boolean(data.is_pinned),
  };
}

export const chatService = {
  /**
   * Local sidebar list (no network).
   */
  getLocalConversations() {
    return listCachedConversations(currentUserId());
  },

  /**
   * @param {{ refresh?: boolean }} [options]
   * - default: return cache after first successful sync
   * - refresh: true forces one GET /conversations
   */
  async getConversations({ refresh = false } = {}) {
    const userId = currentUserId();

    if (!refresh && conversationsSyncedForUser === userId) {
      return listCachedConversations(userId);
    }

    if (conversationsInFlight && !refresh) {
      return conversationsInFlight;
    }

    conversationsInFlight = (async () => {
      try {
        const data = await apiRequest("/conversations", { method: "GET" });
        const serverItems = (data?.items || []).map(mapServerListItem);
        const merged = replaceConversationList(userId, serverItems);
        conversationsSyncedForUser = userId;
        return merged;
      } catch (error) {
        console.error("Failed to load conversations from server:", error);
        return listCachedConversations(userId);
      } finally {
        conversationsInFlight = null;
      }
    })();

    return conversationsInFlight;
  },

  async getConversation(conversationId, { refresh = false } = {}) {
    const userId = currentUserId();

    if (isDraftId(conversationId)) {
      return (
        getCachedConversation(userId, conversationId) ||
        emptyDetail(conversationId)
      );
    }

    const cached = getCachedConversation(userId, conversationId);
    const hasMessages = Boolean(cached?.messages?.length);

    // Prefer cache for already-opened threads unless forced refresh / empty.
    if (!refresh && hasMessages) {
      return cached;
    }

    try {
      const data = await apiRequest(`/conversations/${conversationId}`, {
        method: "GET",
      });
      const detail = mapServerDetail(data);

      if (cached?.messages?.length) {
        detail.messages = detail.messages.map((message) => {
          if (message.role !== "assistant") return message;
          const match = cached.messages.find(
            (cachedMessage) =>
              cachedMessage.role === "assistant" &&
              cachedMessage.content === message.content &&
              cachedMessage.sources?.length
          );
          return match ? { ...message, sources: match.sources } : message;
        });
      }

      upsertCachedConversation(
        userId,
        {
          id: detail.id,
          title: detail.title,
          lastMessage:
            detail.messages[detail.messages.length - 1]?.content || "",
          updatedAt: formatUpdatedAt(detail.updatedAt),
          matter: detail.matter,
          isDraft: false,
        },
        detail
      );

      return detail;
    } catch (error) {
      console.error("Failed to load conversation from server:", error);
      if (cached) return cached;
      throw error;
    }
  },

  async getAvailableConversations(matterId) {
    const conversations = this.getLocalConversations();

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
   * conversation on the first POST /chat (when conversation_id is omitted),
   * or via ensureServerConversation() before conversation-scoped uploads.
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
   * Ensure a real server conversation exists (needed before conversation uploads).
   * Replaces a local draft id when necessary.
   */
  async ensureServerConversation(conversationId, { title, matter = null } = {}) {
    const userId = currentUserId();

    if (!isDraftId(conversationId)) {
      return String(conversationId);
    }

    const created = await apiRequest("/conversations", {
      method: "POST",
      body: JSON.stringify({
        title: title || "New Conversation",
        matter_id: matter?.id || null,
      }),
    });

    const realId = String(created.id);
    const detail =
      getCachedConversation(userId, conversationId) ||
      emptyDetail(realId, matter);

    const nextDetail = {
      ...detail,
      id: realId,
      conversationId: realId,
      title: created.title || detail.title || "New Conversation",
      matter: matter || detail.matter,
    };

    replaceCachedConversationId(
      userId,
      conversationId,
      realId,
      {
        id: realId,
        title: nextDetail.title,
        lastMessage: "",
        updatedAt: "Just now",
        matter: nextDetail.matter,
        isDraft: false,
      },
      nextDetail
    );

    return realId;
  },

  /**
   * Send a message to POST /api/v1/chat.
   * @param {string} conversationId
   * @param {string} message
   * @param {{ matterId?: string|null, documentId?: string|null, signal?: AbortSignal }} [options]
   */
  async sendMessage(conversationId, message, options = {}) {
    const { matterId = null, documentId = null, signal } = options;
    const userId = currentUserId();
    const isDraft = isDraftId(conversationId);

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

    if (documentId) {
      payload.document_id = documentId;
    }

    try {
      const response = await apiRequest("/chat", {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
      });

      const realId = String(response.conversation_id);
      const resources = resolveResources(response);

      const assistantMessage = {
        id: createId("assistant"),
        role: "assistant",
        content: cleanAnswerText(response.response),
        resources,
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
        title: isFirstMessage
          ? titleFromMessage
          : detail.title || titleFromMessage,
        matter: detail.matter || (matterId ? { id: matterId } : null),
        activeDocumentId: documentId || detail.activeDocumentId || null,
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
