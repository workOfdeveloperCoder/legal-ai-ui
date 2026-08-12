import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
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
      className="w-full rounded-xl border border-[#ECECEC] bg-[#FCFAF6] p-4 text-left transition hover:border-[#E4D4B8] hover:shadow-sm"
    >
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF3DA]">
          <MessageSquare size={16} className="text-[#D39A1F]" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 text-sm font-semibold text-[#202124]">
            {conversation.title}
          </h4>

          <p className="mt-1 text-xs text-[#7B8190]">
            {conversation.matter?.title || matterTitle || "Matter"}
          </p>

          {conversation.lastMessage && (
            <p className="mt-2 line-clamp-2 text-xs text-[#7B8190]">
              {conversation.lastMessage}
            </p>
          )}

          <p className="mt-2 text-xs text-[#7B8190]">
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
    <div className="mx-auto grid w-[500px] max-w-3xl gap-3">
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          matterTitle={matterTitle}
          onClick={() => onSelectConversation(conversation.id)}
        />
      ))}
    </div>
  );
}
