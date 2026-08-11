import { Paperclip, Mic, ArrowUp, Square } from "lucide-react";
import { useState } from "react";

export default function PromptBar({ loading = false, onSend, onStop }) {
  const [input, setInput] = useState("");

  async function send() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    await onSend?.(text);
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-3xl border border-black/5 bg-white px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <textarea
          rows={1}
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about Pakistani law..."
          className="max-h-40 min-h-[44px] w-full resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-[1.55] text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
        />

        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              title="Attachments require a matter upload endpoint"
            >
              <Paperclip size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
            >
              <Mic size={16} />
            </button>

            {loading ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-black"
                title="Stop request"
              >
                <Square size={11} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!input.trim()}
                onClick={send}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <ArrowUp size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2.5 text-center text-[11px] text-slate-400">
        AI responses may contain mistakes. Verify legal references before
        relying on them.
      </p>
    </div>
  );
}
