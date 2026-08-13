import { useState } from "react";
import { Bot, User, BookOpen, ChevronDown, ChevronUp, FileText, Scale } from "lucide-react";
import ReactMarkdown from "react-markdown";

function formatTime(message) {
  const value = message.createdAt || message.created_at;
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false);

  const relevance =
    typeof source.score === "number"
      ? Math.round(Math.min(Math.max(source.score, 0), 1) * 100)
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white/80">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-black/[0.02]"
      >
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-yellow/30 text-slate-800">
          <BookOpen size={12} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13px] font-medium text-slate-800">
              {source.title}
            </p>
            <div className="flex shrink-0 items-center gap-1.5 text-slate-400">
              {relevance !== null && (
                <span className="text-[11px] text-slate-500">{relevance}%</span>
              )}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>

          {source.meta && (
            <p className="mt-0.5 line-clamp-1 text-[12px] text-slate-500">
              {source.meta}
            </p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-black/5 px-3 py-2.5">
          {source.summary && (
            <p className="text-[12px] leading-5 text-slate-600">
              {source.summary}
            </p>
          )}

          {source.excerpt && (
            <blockquote className="rounded-lg bg-[#F7F7F8] px-2.5 py-2 text-[12px] leading-5 whitespace-pre-wrap text-slate-700">
              {source.excerpt}
            </blockquote>
          )}

          {source.section && (
            <p className="text-[12px] text-slate-500">
              <span className="font-medium text-slate-700">Sections: </span>
              {source.section}
            </p>
          )}

          {source.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {source.keywords.slice(0, 8).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          {source.filename && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <FileText size={11} />
              <span className="truncate">{source.filename}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const hasError = message.status === "error";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex w-full items-start gap-3 ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            isUser
              ? "bg-yellow text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {isUser ? <User size={14} /> : <Bot size={14} />}
        </div>

        <div
          className={`min-w-0 rounded-3xl px-4 py-3 shadow-sm ${
            isUser
              ? "max-w-[85%] bg-[#FFE2A3] text-slate-800"
              : "w-full flex-1 bg-white text-slate-800 ring-1 ring-slate-200/70"
          } ${hasError ? "ring-1 ring-red-300" : ""}`}
        >
          <div
            className={`text-[15px] leading-[1.65] tracking-[-0.01em] ${
              isUser ? "whitespace-pre-wrap" : ""
            }`}
          >
            {isUser ? (
              <>
                {message.attachments?.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {message.attachments.map((file, index) => (
                      <span
                        key={`${file.filename || file.name}-${index}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-2 py-1 text-[12px] text-slate-700"
                      >
                        <FileText size={12} className="text-amber-700" />
                        <span className="max-w-[180px] truncate">
                          {file.filename || file.name}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                <p className="m-0">{message.content}</p>
              </>
            ) : (
              <div
                className="
                  chat-md
                  [&_p]:my-2.5 [&_p]:first:mt-0 [&_p]:last:mb-0
                  [&_ul]:my-2.5 [&_ol]:my-2.5 [&_li]:my-1
                  [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-[15px] [&_h1]:font-semibold
                  [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-[15px] [&_h2]:font-semibold
                  [&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-[15px] [&_h3]:font-semibold
                  [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]
                  [&_pre]:my-2.5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:text-[13px]
                  [&_blockquote]:my-2.5 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600
                  [&_a]:text-slate-900 [&_a]:underline
                "
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>

          {hasError && message.error && (
            <p className="mt-2 text-[12px] text-red-600">{message.error}</p>
          )}

          {!isUser && message.sources?.length > 0 && (
            <div className="mt-4 border-t border-black/5 pt-3">
              <p className="mb-2 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                Resources · {message.sources.length}
              </p>

              <div className="space-y-1.5">
                {message.sources.map((source, index) => (
                  <SourceCard
                    key={source.id || index}
                    source={source}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          <div
            className={`mt-1.5 text-[11px] ${
              isUser ? "text-right text-slate-400" : "text-slate-400"
            }`}
          >
            {formatTime(message)}
          </div>
        </div>
      </div>
    </div>
  );
}
