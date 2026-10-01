import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatService } from "../../services/chatService";

export default function StartChatBanner() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function send() {
    if (!input.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const conversation = await chatService.createConversation();
      const message = input.trim();
      setInput("");
      navigate(`/conversation/${conversation.id}`, {
        state: { pendingMessage: message },
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err?.message || "Failed to start chat.");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="composer-panel rounded-[20px] border p-5 shadow-[0_10px_30px_rgba(53,68,94,.07)] sm:p-6"
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
          <textarea
          rows={1}
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about Pakistani law..."
          className="max-h-52 min-h-[58px] w-full resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-7 text-[#1D1D1F] outline-none placeholder:text-[#8E8E93] disabled:opacity-60"
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={!input.trim() || loading}
              onClick={(e) => {
                e.preventDefault();
                send();
              }}
              aria-label="Start legal research"
              className="primary-action flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-2 border-t border-slate-100 pt-3 text-[11px] text-[#8E8E93]">Juris answers from available legal sources and identifies when the record is incomplete.</p>

      {loading && (
        <p className="mt-3 text-xs text-slate-400">
          Opening chat…
        </p>
      )}
    </motion.div>
  );
}
