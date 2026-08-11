import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import MatterSidebar from "./matterSidebar";
import MatterHeader from "./MatterHeader";
import ChatArea from "../chat/ChatArea";
import { matterService } from "../../services/matterService";
import { chatService } from "../../services/chatService";

export default function Matter() {
  const { matterId } = useParams();
  const [matter, setMatter] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!matterId) return;
      setLoading(true);
      setError("");

      try {
        const matterData = await matterService.getMatter(matterId);
        if (cancelled) return;
        setMatter(matterData);

        const existing = chatService
          .getLocalConversations()
          .find(
            (conversation) =>
              conversation.matter?.id &&
              String(conversation.matter.id) === String(matterId) &&
              !String(conversation.id).startsWith("draft-")
          );

        if (existing) {
          setConversationId(String(existing.id));
          return;
        }

        const created = await chatService.createConversation({
          matter: {
            id: matterData.id,
            title: matterData.title,
          },
        });

        const realId = await chatService.ensureServerConversation(created.id, {
          title: matterData.title || "Matter chat",
          matter: {
            id: matterData.id,
            title: matterData.title,
          },
        });

        if (!cancelled) setConversationId(realId);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Failed to open matter.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [matterId]);

  async function handleNewChat() {
    if (!matter) return;
    const created = await chatService.createConversation({
      matter: {
        id: matter.id,
        title: matter.title,
      },
    });
    const realId = await chatService.ensureServerConversation(created.id, {
      title: `${matter.title} chat`,
      matter: {
        id: matter.id,
        title: matter.title,
      },
    });
    setConversationId(realId);
  }

  return (
    <div className="flex h-full min-h-0 bg-[#F8F8FA]">
      <div className="flex min-h-0 flex-1 flex-col">
        <MatterHeader
          title={matter?.title || "Matter"}
          matterId={matterId}
          onNewChat={handleNewChat}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden p-4">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : loading || !conversationId ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Opening matter conversation…
              </div>
            ) : (
              <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <ChatArea
                  hideHeader
                  matterId={matterId}
                  conversationId={conversationId}
                />
              </div>
            )}
          </div>

          <MatterSidebar />
        </div>
      </div>
    </div>
  );
}
