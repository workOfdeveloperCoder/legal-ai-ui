import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { chatService } from "../../services/chatService";
import { documentService } from "../../services/documentService";
import {
  getCachedConversation,
  subscribeConversations,
  upsertCachedConversation,
} from "../../lib/conversationStore";
import { getStoredUser } from "../../lib/apiClient";
import {
  getContextLimitErrorMessage,
  isContextLimitError,
} from "../../lib/tokenBudget";

import ChatMessage from "./ChatMessage";
import EmptyState from "./EmptyState";
import PromptBar from "./PromptBar";
import SubHeader from "../layout/SubHeader";
import TypingIndicator from "./TypingIndicator";

export default function ChatArea({
  hideHeader = false,
  matterId = null,
  conversationId: conversationIdProp = null,
}) {
  const [conversation, setConversation] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [tokenBudget, setTokenBudget] = useState(null);
  const [showTrimNotice, setShowTrimNotice] = useState(false);

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  const navigate = useNavigate();
  const params = useParams();
  const conversationId = conversationIdProp || params.conversationId;

  useEffect(() => {
    setShowTrimNotice(false);
    setTokenBudget(null);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return undefined;

    let cancelled = false;

    (async () => {
      setLoadingConversation(true);
      setError("");
      try {
        const data = await chatService.getConversation(conversationId);
        if (!cancelled) {
          setConversation(data);
          if (data?.tokenBudget) setTokenBudget(data.tokenBudget);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Failed to load conversation.");
        }
      } finally {
        if (!cancelled) setLoadingConversation(false);
      }
    })();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return undefined;

    const unsub = subscribeConversations(() => {
      const userId = getStoredUser()?.id || "anonymous";
      const cached = getCachedConversation(userId, conversationId);
      if (cached) {
        setConversation(cached);
        if (cached.tokenBudget) setTokenBudget(cached.tokenBudget);
      }
    });
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, sending, uploading]);

  function handleStop() {
    abortRef.current?.abort();
    setSending(false);
  }

  async function handleSend(text, files = []) {
    if (!conversationId || sending || uploading) return;
    if (!text.trim() && !files.length) return;

    setError("");

    const userId = getStoredUser()?.id || "anonymous";
    let activeId = conversationId;
    let activeConversation =
      conversation ||
      (await chatService.getConversation(conversationId));

    const attachmentNames = files.map((file) => file.name);
    const messageText =
      text.trim() ||
      (files.length
        ? `Please analyze the attached document${files.length > 1 ? "s" : ""}: ${attachmentNames.join(", ")}`
        : "");

    const documentTrigger =
      /\b(summarize|summarise|summary|this document|uploaded document|uploaded file|attached (file|document)|this (pdf|agreement|contract)|analyze this|analyse this)\b/i.test(
        messageText
      );

    setConversation((prev) => ({
      ...(prev || { id: activeId, conversationId: activeId, messages: [] }),
      messages: [
        ...(prev?.messages || []),
        {
          id: `temp-user-${Date.now()}`,
          role: "user",
          content: messageText,
          attachments: attachmentNames.map((name) => ({ filename: name })),
          createdAt: new Date().toISOString(),
          status: "sending",
        },
      ],
    }));

    try {
      let primaryDocumentId = null;

      // Conversation uploads must target a real conversation id.
      if (files.length) {
        setUploading(true);
        activeId = await chatService.ensureServerConversation(activeId, {
          title: messageText,
          matter: activeConversation?.matter ||
            (matterId ? { id: matterId } : null),
        });

        if (String(activeId) !== String(conversationId) && !conversationIdProp) {
          navigate(`/conversation/${activeId}`, { replace: true });
        }

        const uploaded = await documentService.uploadManyToConversation(
          activeId,
          files
        );
        primaryDocumentId = uploaded[0]?.id || null;

        const failed = uploaded.filter(
          (doc) => doc && (doc.vectorized === false || doc.processed === false)
        );
        if (failed.length) {
          throw new Error(
            "The requested document could not be read or indexed. Please re-upload or process the document before asking questions about it."
          );
        }

        // Remember latest upload for follow-up document questions in this chat.
        setConversation((prev) => ({
          ...(prev || { id: activeId, messages: [] }),
          id: activeId,
          activeDocumentId: primaryDocumentId,
        }));

        setUploading(false);
      } else if (
        documentTrigger &&
        (activeConversation?.activeDocumentId || conversation?.activeDocumentId)
      ) {
        primaryDocumentId =
          activeConversation?.activeDocumentId ||
          conversation?.activeDocumentId ||
          null;
      }

      setSending(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const updated = await chatService.sendMessage(activeId, messageText, {
        matterId: matterId || activeConversation?.matter?.id || null,
        documentId: primaryDocumentId,
        signal: controller.signal,
      });

      if (primaryDocumentId && updated) {
        updated.activeDocumentId = primaryDocumentId;
      }

      if (attachmentNames.length && updated?.messages?.length) {
        const messages = [...updated.messages];
        for (let i = messages.length - 1; i >= 0; i -= 1) {
          if (messages[i].role === "user") {
            messages[i] = {
              ...messages[i],
              attachments: attachmentNames.map((name) => ({
                filename: name,
              })),
            };
            break;
          }
        }
        updated.messages = messages;
        upsertCachedConversation(
          userId,
          {
            id: updated.id,
            title: updated.title,
            lastMessage: messageText,
            updatedAt: "Just now",
            matter: updated.matter,
            isDraft: false,
          },
          updated
        );
      }

      setConversation(updated);
      setTokenBudget(updated?.tokenBudget ?? null);
      if (updated?.contextTrimmed || updated?.tokenBudget?.trimmed) {
        setShowTrimNotice(true);
      }

      if (
        !conversationIdProp &&
        String(updated.conversationId) !== String(conversationId)
      ) {
        navigate(`/conversation/${updated.conversationId}`, { replace: true });
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        setError("Request cancelled.");
      } else if (isContextLimitError(err)) {
        setError(getContextLimitErrorMessage());
      } else {
        console.error("Failed to send message:", err);
        setError(err?.message || "Failed to send message.");
      }
      try {
        const data = await chatService.getConversation(activeId);
        setConversation(data);
        if (data?.tokenBudget) setTokenBudget(data.tokenBudget);
      } catch {
        // ignore
      }
    } finally {
      setUploading(false);
      setSending(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex h-full flex-col">
      <SubHeader
        hideHeader={hideHeader}
        title={conversation?.title || "New Conversation"}
        description={null}
      />

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {loadingConversation && !conversation?.messages?.length ? (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8">
            <div className="h-10 animate-pulse rounded-2xl bg-slate-200/80" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : !conversation?.messages?.length ? (
          <EmptyState />
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-6">
            {conversation.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                matterId={matterId || conversation?.matter?.id || null}
                conversationId={conversationId || conversation?.id || null}
              />
            ))}

            {(sending || uploading) && (
              <TypingIndicator
              label = {
                uploading ? "Uploading and indexing documents..." : "Legal AI is researching..."
              }
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-transparent px-6 pb-5 pt-2">
        {showTrimNotice && (
          <div className="mx-auto mb-3 w-full max-w-5xl rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-2.5 text-[13px] text-amber-900">
            Earlier context was automatically compressed.
          </div>
        )}
        {error && (
          <div className="mx-auto mb-3 w-full max-w-5xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <PromptBar
          loading={sending}
          uploading={uploading}
          tokenBudget={tokenBudget}
          onSend={handleSend}
          onStop={handleStop}
        />
      </div>
    </div>
  );
}
