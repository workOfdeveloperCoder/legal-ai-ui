/**
 * Client-side conversation cache.
 *
 * `legal-chatbot` persists conversations server-side but does not yet expose
 * HTTP routes to list conversations or fetch message history. Until those
 * endpoints exist, the UI keeps a per-user local cache so sidebar + reload
 * work for chats started in this browser.
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

function writeStore(userId, store) {
  localStorage.setItem(storageKey(userId), JSON.stringify(store));
  window.dispatchEvent(new Event(CHANGE_EVENT));
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

export function saveCachedDetail(userId, conversationId, detail) {
  const store = readStore(userId);
  const id = String(conversationId);
  store.details[id] = {
    ...detail,
    id,
    conversationId: id,
  };
  writeStore(userId, store);
}

export function clearCachedConversations(userId) {
  localStorage.removeItem(storageKey(userId));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
