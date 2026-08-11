import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { chatService } from "../../services/chatService";
import {
  getCachedConversation,
  subscribeConversations,
} from "../../lib/conversationStore";
import { getStoredUser } from "../../lib/apiClient";

import ChatMessage from "./ChatMessage";
import EmptyState from "./EmptyState";
import PromptBar from "./PromptBar";
import SubHeader from "../layout/SubHeader";

export default function ChatArea({ hideHeader = false, matterId = null }) {
  const [conversation, setConversation] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  const navigate = useNavigate();
  const { conversationId } = useParams();

  useEffect(() => {
    if (!conversationId) return undefined;

    let cancelled = false;

    (async () => {
      setLoadingConversation(true);
      setError("");
      try {
        // Network only when opening a thread (or cache is empty).
        const data = await chatService.getConversation(conversationId);
        if (!cancelled) setConversation(data);
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

    // Optimistic/local updates only — never re-hit the list/detail APIs here.
    const unsub = subscribeConversations(() => {
      const userId = getStoredUser()?.id || "anonymous";
      const cached = getCachedConversation(userId, conversationId);
      if (cached) setConversation(cached);
    });
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, sending]);

  function handleStop() {
    abortRef.current?.abort();
    setSending(false);
  }

  async function handleSend(text) {
    if (!conversationId || sending) return;

    setSending(true);
    setError("");

    const controller = new AbortController();
    abortRef.current = controller;

    setConversation((prev) => ({
      ...(prev || { id: conversationId, conversationId, messages: [] }),
      messages: [
        ...(prev?.messages || []),
        {
          id: `temp-user-${Date.now()}`,
          role: "user",
          content: text,
          createdAt: new Date().toISOString(),
          status: "sending",
        },
      ],
    }));

    try {
      const updated = await chatService.sendMessage(conversationId, text, {
        matterId,
        signal: controller.signal,
      });

      setConversation(updated);

      if (String(updated.conversationId) !== String(conversationId)) {
        navigate(`/conversation/${updated.conversationId}`, { replace: true });
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        setError("Request cancelled.");
      } else {
        console.error("Failed to send message:", err);
        setError(err?.message || "Failed to send message.");
      }
      try {
        const data = await chatService.getConversation(conversationId);
        setConversation(data);
      } catch {
        // ignore reload errors
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex h-full flex-col">
      <SubHeader
        hideHeader={hideHeader}
        title={conversation?.title || "New Conversation"}
        description="AI-powered legal research & drafting"
      />

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {loadingConversation && !conversation?.messages?.length ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8">
            <div className="h-10 animate-pulse rounded-2xl bg-slate-200/80" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : !conversation?.messages?.length ? (
          <EmptyState />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 py-6">
            {conversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {sending && (
              <div className="flex items-center gap-3 px-0.5">
                <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-2.5 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="h-2.5 w-56 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-slate-200/80 bg-[#F7F8FC] px-6 py-4">
        {error && (
          <div className="mx-auto mb-3 w-full max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <PromptBar
          loading={sending}
          onSend={handleSend}
          onStop={handleStop}
        />
      </div>
    </div>
  );
}
