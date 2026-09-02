import { useEffect, useRef, useState } from "react";
import {
  Bot,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Volume2,
  Square,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { withHardBreaks } from "../../lib/streamText";
import {
  describeVoiceError,
  getVoiceStatus,
  playSpeech,
  stopSpeech,
} from "../../services/voiceService";
import DocumentSourcePanel from "./DocumentSourcePanel";
import ThinkingBlock from "./ThinkingBlock";

let ttsReadyCache = null;
let ttsReadyInflight = null;

async function loadTtsReady() {
  if (ttsReadyCache !== null) return ttsReadyCache;
  if (ttsReadyInflight) return ttsReadyInflight;
  ttsReadyInflight = (async () => {
    try {
      const status = await getVoiceStatus();
      ttsReadyCache = Boolean(status?.tts_ready ?? status?.ttsReady);
    } catch {
      ttsReadyCache = false;
    } finally {
      ttsReadyInflight = null;
    }
    return ttsReadyCache;
  })();
  return ttsReadyInflight;
}

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

function SourceCard({ source, onOpenDocument }) {
  const [expanded, setExpanded] = useState(false);

  const relevance =
    typeof source.relevancePercent === "number"
      ? source.relevancePercent
      : null;

  const canOpenDocument = Boolean(
    source.documentId || source.evidence?.length || source.excerpt
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
  const [ttsReady, setTtsReady] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakError, setSpeakError] = useState("");
  const speakAbortRef = useRef(null);
  const displayResources = message.resources || [];

  useEffect(() => {
    if (isUser) return undefined;
    let cancelled = false;
    (async () => {
      const ready = await loadTtsReady();
      if (!cancelled) setTtsReady(ready);
    })();
    return () => {
      cancelled = true;
    };
  }, [isUser]);

  useEffect(() => {
    return () => {
      speakAbortRef.current?.abort();
      stopSpeech();
    };
  }, []);

  async function handleSpeak() {
    if (!message.content || message.streaming) return;
    if (speaking) {
      speakAbortRef.current?.abort();
      stopSpeech();
      setSpeaking(false);
      return;
    }
    setSpeakError("");
    setSpeaking(true);
    const controller = new AbortController();
    speakAbortRef.current = controller;
    try {
      await playSpeech(message.content, { signal: controller.signal });
    } catch (error) {
      if (error?.name !== "AbortError") {
        setSpeakError(describeVoiceError(error));
      }
    } finally {
      setSpeaking(false);
      speakAbortRef.current = null;
    }
  }

  return (
    <div className={`flex w-full min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex w-full min-w-0 items-start gap-3 ${
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
          className={`min-w-0 overflow-hidden rounded-3xl px-4 py-3 shadow-sm ${
            isUser
              ? "max-w-[85%] bg-[#FFE2A3] text-slate-800"
              : "max-w-full flex-1 bg-white text-slate-800 ring-1 ring-slate-200/70"
          } ${hasError ? "ring-1 ring-red-300" : ""}`}
        >
          <div
            className={`min-w-0 max-w-full text-[15px] leading-[1.65] tracking-[-0.01em] break-words [overflow-wrap:anywhere] ${
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
                <p className="m-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  {message.content}
                </p>
              </>
            ) : (
              <>
                {(message.thinkingActive ||
                  message.thinking ||
                  (message.streaming && !message.content)) && (
                  <ThinkingBlock
                    text={message.thinking || ""}
                    active={Boolean(
                      message.thinkingActive ||
                        (message.streaming && !message.content)
                    )}
                    statusLabel={message.statusDetail || ""}
                    startedAt={message.thinkingStartedAt || null}
                  />
                )}
                {(message.content ||
                  (message.streaming && !message.thinkingActive)) && (
                  <div
                    className="
                chat-md min-w-0 max-w-full
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
                    {message.streaming ? (
                      <>
                        <div className="min-w-0 max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                          {message.content}
                          <span className="stream-caret" aria-hidden="true" />
                        </div>
                      </>
                    ) : message.content ? (
                      <ReactMarkdown>
                        {withHardBreaks(message.content)}
                      </ReactMarkdown>
                    ) : null}
                  </div>
                )}
                {!message.streaming &&
                  !message.content &&
                  !hasError &&
                  !message.thinkingActive && (
                    <p className="m-0 text-[14px] leading-6 text-slate-600">
                      {displayResources.length > 0 ? (
                        <>
                          No answer text was returned, but{" "}
                          <span className="font-medium text-slate-800">
                            {displayResources.length} resource
                            {displayResources.length === 1 ? "" : "s"}
                          </span>{" "}
                          were retrieved — open them below. If this keeps
                          happening, retry or ask{" "}
                          <span className="font-medium text-slate-800">
                            section 54-C Electricity Act 1910
                          </span>
                          .
                        </>
                      ) : (
                        <>
                          No visible answer was returned. The model may have
                          spent its budget on hidden reasoning — try again, or
                          ask more specifically (e.g.{" "}
                          <span className="font-medium text-slate-800">
                            section 54-C Electricity Act 1910
                          </span>
                          ).
                        </>
                      )}
                    </p>
                  )}
              </>
            )}
          </div>

          {hasError && message.error && (
            <p className="mt-2 text-[12px] text-red-600">{message.error}</p>
          )}

          {!isUser && !message.streaming && displayResources.length > 0 && (
            <div className="mt-4 border-t border-black/5 pt-3">
              <p className="mb-2 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                Resources · {displayResources.length}
              </p>

              <div className="space-y-1.5">
                {displayResources.map((source, index) => (
                  <SourceCard
                    key={source.documentId || source.id || `resource-${index}`}
                    source={source}
                    onOpenDocument={setActiveSource}
                  />
                ))}
              </div>
            </div>
          )}

          {!isUser && !message.streaming && message.content && ttsReady && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleSpeak()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-700 hover:bg-slate-100"
                title={speaking ? "Stop speaking" : "Speak answer"}
              >
                {speaking ? (
                  <Square size={11} fill="currentColor" />
                ) : (
                  <Volume2 size={13} />
                )}
                {speaking ? "Stop" : "Speak"}
              </button>
              {speakError && (
                <span className="text-[11px] text-rose-600">{speakError}</span>
              )}
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
