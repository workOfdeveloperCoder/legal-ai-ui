import { Mic, ArrowUp, Paperclip } from "lucide-react";
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
      const updated = await chatService.sendMessage(
        conversation.id,
        input.trim()
      );

      setInput("");
      navigate(`/conversation/${updated.conversationId}`);
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
      className="rounded-3xl bg-[#23232F] p-8 text-white shadow-lg"
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
          className="max-h-52 min-h-[54px] w-full resize-none border-0 bg-transparent px-3 py-2 text-[15px] leading-7 text-white outline-none placeholder:text-slate-400 disabled:opacity-60"
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/10"
            >
              <Paperclip size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/10"
            >
              <Mic size={18} />
            </button>

            <button
              type="button"
              disabled={!input.trim() || loading}
              onClick={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffc853] text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <p className="mt-3 text-xs text-slate-400">
          Waiting for Legal Chatbot response…
        </p>
      )}
    </motion.div>
  );
}
