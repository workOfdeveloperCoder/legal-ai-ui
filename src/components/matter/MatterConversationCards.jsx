import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Search, X } from "lucide-react";
import { matterService } from "../../services/matterService";

function formatChatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function ConversationCard({ conversation, matterTitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="matter-chat-card w-full rounded-xl border border-white/80 bg-white/70 p-3 text-left transition hover:border-[#B8D8FF] hover:shadow-sm"
    >
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF]">
          <MessageSquare size={16} className="text-[#007AFF]" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 text-sm font-semibold text-[#202124]">
            {conversation.title}
          </h4>

          <p className="mt-1 text-xs text-[#7B8190]">
            {conversation.matter?.title || matterTitle || "Matter"}
          </p>

          {conversation.lastMessage && (
            <p className="mt-1 line-clamp-1 text-xs text-[#7B8190]">
              {conversation.lastMessage}
            </p>
          )}

          <p className="mt-1 text-xs text-[#7B8190]">
            {formatChatDate(conversation.updatedAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function MatterConversationCards({
  matterId,
  matterTitle = "",
  onSelectConversation,
  onListLoaded,
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      if (!matterId) return;
      setLoading(true);
      setError("");

      try {
        const data = await matterService.getMatterConversations(matterId);
        if (!cancelled) {
          setConversations(data);
          onListLoaded?.(data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Failed to load chats.");
          setConversations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [matterId, onListLoaded]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return conversations;
    return conversations.filter((conversation) =>
      [conversation.title, conversation.lastMessage, conversation.matter?.title]
        .some((value) => String(value || "").toLocaleLowerCase().includes(normalizedQuery))
    );
  }, [conversations, query]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading chats…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <div>
          <p className="text-sm font-medium text-slate-700">No chats yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Use &quot;New Chat&quot; above to start a conversation for this
            matter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="matter-chat-section" aria-label="Chats in this matter">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div><h2 className="font-semibold text-slate-900">Chats</h2><p className="mt-1 text-sm text-slate-500">Search and reopen conversations in this matter.</p></div>
        <span className="shrink-0 rounded-full bg-white/65 px-3 py-1 text-xs font-medium text-slate-600">{conversations.length} {conversations.length === 1 ? "chat" : "chats"}</span>
      </div>
      <label className="relative mb-3 block">
        <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats in this matter" aria-label="Search chats in this matter" className="search-field w-full rounded-xl border border-white/80 bg-white/65 py-2.5 pl-10 pr-10 text-sm text-slate-800 shadow-sm placeholder:text-slate-400" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear chat search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-blue-50"><X size={15}/></button>}
      </label>
      {filteredConversations.length ? <div className="matter-chat-list hide-scrollbar" role="list" aria-label="Matter conversations">
      {filteredConversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          matterTitle={matterTitle}
          onClick={() => onSelectConversation(conversation.id)}
        />
      ))}
      </div> : <div className="rounded-xl border border-dashed border-slate-300/80 bg-white/35 px-4 py-6 text-center text-sm text-slate-500">No chats match “{query}”. Try another search.</div>}
    </section>
  );
}
