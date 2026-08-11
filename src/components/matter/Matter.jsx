import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import MatterSidebar from "./matterSidebar";
import MatterHeader from "./MatterHeader";
import { matterService } from "../../services/matterService";
import { chatService } from "../../services/chatService";

export default function Matter() {
  const { matterId } = useParams();
  const navigate = useNavigate();
  const [matter, setMatter] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!matterId) return;
      setError("");

      try {
        const matterData = await matterService.getMatter(matterId);
        if (cancelled) return;
        setMatter(matterData);

        const existing = (await chatService.getConversations()).find(
          (conversation) =>
            conversation.matter?.id &&
            String(conversation.matter.id) === String(matterId)
        );

        if (existing) {
          navigate(`/conversation/${existing.id}`, { replace: true });
          return;
        }

        const created = await chatService.createConversation({
          matter: {
            id: matterData.id,
            title: matterData.title,
          },
        });

        navigate(`/conversation/${created.id}`, { replace: true });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Failed to open matter chat.");
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [matterId, navigate]);

  return (
    <div className="flex h-screen bg-[#F8F8FA]">
      <div className="flex flex-1 flex-col">
        <MatterHeader title={matter?.title} />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden p-6">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Opening matter conversation…
              </div>
            )}
          </div>

          <MatterSidebar />
        </div>
      </div>
    </div>
  );
}
