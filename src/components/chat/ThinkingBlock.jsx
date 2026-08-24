import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

function formatElapsed(seconds) {
  if (seconds < 1) return "";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

export default function ThinkingBlock({
  text = "",
  active = false,
  statusLabel = "",
  startedAt = null,
}) {
  const [open, setOpen] = useState(active);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (active) setOpen(true);
    else if (text) setOpen(false);
  }, [active, text]);

  useEffect(() => {
    if (!startedAt) return undefined;
    const tick = () =>
      setElapsed(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    tick();
    if (!active) return undefined;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [active, startedAt]);

  const timeLabel = formatElapsed(elapsed);
  const header = active
    ? statusLabel || (text ? "Thinking" : "Searching sources")
    : timeLabel
      ? `Thought for ${timeLabel}`
      : "Thought process";

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 text-left text-[13px] font-medium text-slate-500 hover:text-slate-800"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className={active ? "thinking-shimmer" : ""}>{header}</span>
        {active && (
          <span className="ml-1 inline-flex gap-0.5">
            <span className="typing-dot h-1 w-1" />
            <span className="typing-dot h-1 w-1 [animation-delay:0.15s]" />
            <span className="typing-dot h-1 w-1 [animation-delay:0.3s]" />
          </span>
        )}
      </button>
      {open && (text || statusLabel) && (
        <div className="mt-2 max-h-48 overflow-x-hidden overflow-y-auto border-l-2 border-slate-200 pl-3 text-[13px] leading-5 break-words whitespace-pre-wrap text-slate-500 [overflow-wrap:anywhere]">
          {text || statusLabel}
        </div>
      )}
    </div>
  );
}
