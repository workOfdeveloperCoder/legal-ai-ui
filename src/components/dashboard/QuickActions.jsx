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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(data || []).map((action) => {
          const Icon = Icons[action.icon] || Icons.Sparkles;

          return (
            <button
              key={action.id || action.slug || action.title}
              type="button"
              onClick={() => handleClick(action)}
              className="quick-action-card group rounded-[18px] border p-5 text-left shadow-[0_1px_2px_rgba(0,0,0,.025)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(31,41,55,.10)]"
            >
              <div className="flex items-start gap-4">
                <div className="quick-action-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl max-[999px]:hidden">
                  <Icon size={20} strokeWidth={1.8} />
                </div>

                <div className="ml-2 flex-1 text-left">
                  <p className="text-[13px] font-semibold text-[#1D1D1F]">{action.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#6E6E73]">
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
