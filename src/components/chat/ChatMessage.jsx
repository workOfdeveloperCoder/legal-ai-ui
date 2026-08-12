import { useState } from "react";
import { Bot, User, BookOpen, ChevronDown, ChevronUp, FileText, Scale, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";

import DocumentSourcePanel from "./DocumentSourcePanel";

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

function SourceCard({ source, index, matterId, conversationId, onOpenDocument }) {
  const [expanded, setExpanded] = useState(false);

  const relevance =
    typeof source.relevancePercent === "number"
      ? source.relevancePercent
      : null;

  const canOpenDocument = Boolean(
    source.documentId &&
      (matterId ||
        conversationId ||
        source.matterId ||
        source.conversationId)
  );
  const label = source.displayName || source.title || source.filename || "Source";

  const handleOpen = () => {
    if (canOpenDocument) {
      onOpenDocument(source);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white/80">
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-yellow/30 text-slate-800">
          <BookOpen size={12} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {canOpenDocument ? (
              <button
                type="button"
                onClick={handleOpen}
                className="group min-w-0 flex-1 text-left"
              >
                <p className="truncate text-[13px] font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 group-hover:text-slate-950 group-hover:decoration-slate-500">
                  {label}
                </p>
                {source.filename && source.filename !== label && (
                  <p className="mt-0.5 truncate text-[12px] text-slate-500">
                    {source.filename}
                  </p>
                )}
              </button>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-800">
                  {label}
                </p>
                {source.filename && source.filename !== label && (
                  <p className="mt-0.5 truncate text-[12px] text-slate-500">
                    {source.filename}
                  </p>
                )}
              </div>
            )}

            <div className="flex shrink-0 items-center gap-1.5 text-slate-400">
              {canOpenDocument && (
                <button
                  type="button"
                  onClick={handleOpen}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Open document"
                  title="Open full document"
                >
                  <ExternalLink size={14} />
                </button>
              )}
              {relevance !== null && (
                <span className="text-[11px] text-slate-500">{relevance}%</span>
              )}
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="rounded-md p-1 hover:bg-slate-100"
                aria-label={expanded ? "Collapse source" : "Expand source"}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {source.meta && (
            <p className="mt-0.5 line-clamp-1 text-[12px] text-slate-500">
              {source.meta}
            </p>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-black/5 px-3 py-2.5">
          {source.summary && (
            <p className="text-[12px] leading-5 text-slate-600">
              {source.summary}
            </p>
          )}

          {source.evidence?.length > 1 && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Evidence · {source.evidence.length} passages
            </p>
          )}

          {source.evidence?.length > 0 ? (
            <div className="space-y-2">
              {source.evidence.map((item, evidenceIndex) => (
                <blockquote
                  key={item.sourceId || evidenceIndex}
                  className="rounded-lg bg-[#F7F7F8] px-2.5 py-2 text-[12px] leading-5 whitespace-pre-wrap text-slate-700"
                >
                  {item.excerpt}
                </blockquote>
              ))}
            </div>
          ) : (
            source.excerpt && (
              <blockquote className="rounded-lg bg-[#F7F7F8] px-2.5 py-2 text-[12px] leading-5 whitespace-pre-wrap text-slate-700">
                {source.excerpt}
              </blockquote>
            )
          )}

          {canOpenDocument && (
            <button
              type="button"
              onClick={handleOpen}
              className="text-[12px] font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
            >
              View full document with highlighted passage
            </button>
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

export default function ChatMessage({
  message,
  matterId = null,
  conversationId = null,
}) {
  const isUser = message.role === "user";
  const hasError = message.status === "error";
  const [activeSource, setActiveSource] = useState(null);
  const displayResources = message.resources || [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex w-full max-w-3xl items-start gap-3 ${
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
          className={`min-w-0 max-w-[min(100%,42rem)] rounded-3xl px-4 py-3 shadow-sm ${
            isUser
              ? "bg-[#FFE2A3] text-slate-800"
              : "bg-[#F7F8FC] text-slate-800"
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

          {!isUser && displayResources.length > 0 && (
            <div className="mt-4 border-t border-black/5 pt-3">
              <p className="mb-2 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                Resources · {displayResources.length}
              </p>

              <div className="space-y-1.5">
                {displayResources.map((source, index) => (
                  <SourceCard
                    key={source.documentId || source.id || `resource-${index}`}
                    source={source}
                    index={index}
                    matterId={matterId}
                    conversationId={conversationId}
                    onOpenDocument={setActiveSource}
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

      {activeSource && (
        <DocumentSourcePanel
          source={activeSource}
          matterId={matterId}
          conversationId={conversationId}
          onClose={() => setActiveSource(null)}
        />
      )}
    </div>
  );
}
