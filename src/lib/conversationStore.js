/**
 * Client-side conversation cache.
 *
 * Server list is fetched once on login (or explicit refresh).
 * Cache events update the sidebar from local state — they must not
 * trigger another GET /conversations.
 */

const CHANGE_EVENT = "legal-ai:conversations-changed";

function storageKey(userId) {
  return `legal_ai_conversations_${userId || "anonymous"}`;
}

function readStore(userId) {
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) {
    return { conversations: [], details: {} };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : [],
      details:
        parsed.details && typeof parsed.details === "object"
          ? parsed.details
          : {},
    };
  } catch {
    return { conversations: [], details: {} };
  }
}

function writeStore(userId, store, { emit = true } = {}) {
  localStorage.setItem(storageKey(userId), JSON.stringify(store));
  if (emit) {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function subscribeConversations(listener) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

export function listCachedConversations(userId) {
  return readStore(userId).conversations;
}

export function getCachedConversation(userId, conversationId) {
  const store = readStore(userId);
  return store.details[conversationId] || null;
}

/**
 * Replace server-backed list metas in one write (single event).
 * Preserves draft metas and existing details.
 */
export function replaceConversationList(userId, serverMetas) {
  const store = readStore(userId);
  const drafts = store.conversations.filter((item) =>
    String(item.id).startsWith("draft-")
  );
  const serverIds = new Set(serverMetas.map((item) => String(item.id)));

  // Drop stale non-draft metas not returned by the server.
  const nextConversations = [
    ...drafts,
    ...serverMetas.map((meta) => ({ ...meta, id: String(meta.id) })),
  ];

  // Keep details for drafts + known server ids; drop orphaned non-drafts.
  const nextDetails = {};
  for (const [id, detail] of Object.entries(store.details)) {
    if (String(id).startsWith("draft-") || serverIds.has(String(id))) {
      nextDetails[id] = detail;
    }
  }

  for (const meta of serverMetas) {
    const id = String(meta.id);
    if (!nextDetails[id]) {
      nextDetails[id] = {
        id,
        conversationId: id,
        title: meta.title || "New Conversation",
        matter: meta.matter || null,
        messages: [],
        model: "legal-chatbot",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  writeStore(userId, {
    conversations: nextConversations,
    details: nextDetails,
  });

  return nextConversations;
}

export function upsertCachedConversation(userId, meta, detail) {
  const store = readStore(userId);
  const id = String(meta.id);

  const existingIndex = store.conversations.findIndex(
    (item) => String(item.id) === id
  );

  const nextMeta = {
    ...meta,
    id,
  };

  if (existingIndex >= 0) {
    store.conversations[existingIndex] = {
      ...store.conversations[existingIndex],
      ...nextMeta,
    };
  } else {
    store.conversations.unshift(nextMeta);
  }

  if (detail) {
    store.details[id] = {
      ...detail,
      id,
      conversationId: id,
    };
  }

  writeStore(userId, store);
  return nextMeta;
}

export function replaceCachedConversationId(userId, fromId, toId, meta, detail) {
  const store = readStore(userId);
  const from = String(fromId);
  const to = String(toId);

  store.conversations = store.conversations.filter(
    (item) => String(item.id) !== from && String(item.id) !== to
  );

  store.conversations.unshift({
    ...meta,
    id: to,
  });

  if (store.details[from]) {
    delete store.details[from];
  }

  store.details[to] = {
    ...detail,
    id: to,
    conversationId: to,
  };

  writeStore(userId, store);
}

export function saveCachedDetail(userId, conversationId, detail, { emit = true } = {}) {
  const store = readStore(userId);
  const id = String(conversationId);
  store.details[id] = {
    ...detail,
    id,
    conversationId: id,
  };
  writeStore(userId, store, { emit });
}

export function removeCachedConversation(userId, conversationId) {
  const store = readStore(userId);
  const id = String(conversationId);
  store.conversations = store.conversations.filter(
    (item) => String(item.id) !== id
  );
  if (store.details[id]) {
    delete store.details[id];
  }
  writeStore(userId, store);
}

export function renameCachedConversation(userId, conversationId, title) {
  const store = readStore(userId);
  const id = String(conversationId);
  const cleaned = String(title || "").trim() || "New Conversation";

  store.conversations = store.conversations.map((item) =>
    String(item.id) === id ? { ...item, title: cleaned } : item
  );

  if (store.details[id]) {
    store.details[id] = {
      ...store.details[id],
      title: cleaned,
    };
  }

  writeStore(userId, store);
  return cleaned;
}

export function clearCachedConversations(userId) {
  localStorage.removeItem(storageKey(userId));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
