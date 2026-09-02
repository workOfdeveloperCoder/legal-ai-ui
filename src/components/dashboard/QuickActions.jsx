import * as Icons from "lucide-react";
import { useNavigate } from "react-router-dom";

import { chatService } from "../../services/chatService";

export default function QuickActions({ data }) {
  const navigate = useNavigate();

  async function handleClick(action) {
    if (action.slug || action.pendingMessage) {
      try {
        const conversation = await chatService.createConversation();
        navigate(`/conversation/${conversation.id}`, {
          state: {
            pendingMessage:
              action.pendingMessage || action.prompt || action.title,
            pendingQuickAction: action.slug || action.quickAction || null,
            pendingWebSearch: Boolean(
              action.enablesWebSearch || action.enables_web_search
            ),
          },
        });
      } catch (error) {
        console.error("Failed to start quick action chat:", error);
      }
      return;
    }

    if (action.href) {
      navigate(action.href);
    }
  }

  return (
    <div className="grid">
      <h2 className="py-2 text-lg font-semibold">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-3">
        {(data || []).map((action) => {
          const Icon = Icons[action.icon] || Icons.Sparkles;

          return (
            <button
              key={action.id || action.slug || action.title}
              type="button"
              onClick={() => handleClick(action)}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 max-[999px]:hidden items-center justify-center rounded-xl bg-yellow-50">
                  <Icon size={32} className="text-yellow-500" />
                </div>

                <div className="ml-2 flex-1 text-left">
                  <p className="font-semibold text-slate-900">{action.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
