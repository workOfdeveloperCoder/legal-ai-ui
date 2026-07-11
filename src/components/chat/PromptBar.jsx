import { Paperclip, Globe, Sparkles, Mic, ArrowUp } from "lucide-react";
import { useState } from "react";
import { chatService } from "../../services/chatService";

export default function PromptBar({
    conversation,
    setConversation,
}) {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    async function send() {
        if (!input.trim() || loading) return;

        setLoading(true);

        try {
            const updatedConversation = await chatService.sendMessage(
                conversation.conversationId,
                input.trim()
            );

            setConversation(updatedConversation);
            setInput("");
        } catch (error) {
            console.error("Failed to send message:", error);
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
    <div className="mx-auto bg-[#F7F8FC] w-full max-w-5xl">

      <div className="rounded-[30px] border border-slate-200 bg-background p-3 shadow-xl shadow-slate-200/60">

        {/* Textarea */}
        <textarea
          rows={1}
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about Pakistani law..."
          className="max-h-52 min-h-[54px] w-full resize-none border-0 bg-transparent px-3 py-2 text-[15px] leading-7 text-slate-800 outline-none placeholder:text-slate-400"
        />

        {/* Bottom Toolbar */}
        <div className="mt-3 flex items-center justify-between">

          {/* Left */}
          <div className="flex items-center gap-2">

            <button className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-slate-100">
              <Paperclip size={18} />
            </button>

          </div>

          {/* Right */}
          <div className="flex items-center gap-2">

            <button className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-slate-100">
              <Mic size={18} />
            </button>

            <button
              disabled={!input.trim()}
              onClick={send}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:scale-105 hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <ArrowUp size={18} />
            </button>

          </div>

        </div>

      </div>

      {/* Footer */}
      <p className="mt-4 text-center text-xs text-slate-400">
        AI responses may contain mistakes. Verify legal references before relying on them.
      </p>

    </div>
  );
}