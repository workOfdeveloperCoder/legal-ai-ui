import {
  Paperclip,
  Mic,
  ArrowUp,
  Square,
  X,
  FileText,
  Globe,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ACCEPTED_UPLOAD_TYPES,
  isAllowedUploadFile,
  MAX_UPLOAD_BYTES,
} from "../../services/documentService";
import {
  MAX_STT_SECONDS,
  microphoneAvailability,
  startWavRecorder,
} from "../../lib/recordWav";
import { getWebSearchSettings } from "../../lib/webSearchSettings";
import {
  describeVoiceError,
  transcribeWav,
} from "../../services/voiceService";
import ContextUsageIndicator from "./ContextUsageIndicator";
import { getLlmModels } from "../../services/llmService";

const WAVE_BARS = 36;

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function appendTranscript(current, transcript) {
  const next = String(transcript || "").trim();
  if (!next) return current;
  const prev = String(current || "").trimEnd();
  if (!prev) return next;
  return `${prev} ${next}`;
}

export default function PromptBar({
  loading = false,
  uploading = false,
  tokenBudget = null,
  onSend,
  onStop,
}) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [attachError, setAttachError] = useState("");
  const [dictateError, setDictateError] = useState("");
  const [dictating, setDictating] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [bars, setBars] = useState(() => Array(WAVE_BARS).fill(0.12));
  const [webSearchAvailable, setWebSearchAvailable] = useState(true);
  const [webSearch, setWebSearch] = useState(false);
  const [webSearchProvider, setWebSearchProvider] = useState(null);
  const [modelOptions, setModelOptions] = useState([]);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    () => window.localStorage.getItem("juris.selectedChatModel") || ""
  );
  const fileInputRef = useRef(null);
  const modelPickerRef = useRef(null);
  const textareaRef = useRef(null);
  const recorderRef = useRef(null);
  const finishingRef = useRef(false);
  const finishDictateRef = useRef(null);

  const busy = loading || uploading;
  const voiceBusy = dictating || transcribing;
  const canSend = Boolean(input.trim() || files.length) && !busy && !voiceBusy;
  const mic = microphoneAvailability();
  const activeModel = modelOptions.find((model) => model.id === selectedModel);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "40px";
    const nextHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 160 ? "auto" : "hidden";
  }, [input, dictating, transcribing]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getWebSearchSettings();
      if (cancelled) return;
      setWebSearchAvailable(settings.enabled);
      setWebSearchProvider(settings.provider);
      if (!settings.enabled) setWebSearch(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!modelPickerOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!modelPickerRef.current?.contains(event.target)) {
        setModelPickerOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setModelPickerOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [modelPickerOpen]);

  useEffect(() => {
    let cancelled = false;
    getLlmModels()
      .then((data) => {
        if (cancelled) return;
        const options = Array.isArray(data?.models) ? data.models : [];
        setModelOptions(options);
        const saved = window.localStorage.getItem("juris.selectedChatModel");
        const preferred = options.some((item) => item.id === saved)
          ? saved
          : data?.default_model || options[0]?.id || "";
        setSelectedModel(preferred);
        if (preferred) {
          window.localStorage.setItem("juris.selectedChatModel", preferred);
        }
      })
      .catch((error) => {
        console.warn("Could not load available chat models:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dictating) return undefined;
    const analyser = recorderRef.current?.analyser;
    if (!analyser) return undefined;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const step = Math.max(1, Math.floor(data.length / WAVE_BARS));
      const next = [];
      for (let i = 0; i < WAVE_BARS; i += 1) {
        next.push(Math.min(1, data[i * step] / 180));
      }
      setBars(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dictating]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && (dictating || transcribing)) {
        event.preventDefault();
        cancelDictate();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dictating, transcribing]);

  useEffect(
    () => () => {
      recorderRef.current?.cancel();
      recorderRef.current = null;
    },
    []
  );

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    setAttachError("");
    const next = [...files];

    for (const file of incoming) {
      if (!isAllowedUploadFile(file)) {
        setAttachError(
          `"${file.name}" is not supported. Use PDF or text files under 25MB.`
        );
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setAttachError(`"${file.name}" exceeds the 25MB limit.`);
        continue;
      }
      const duplicate = next.some(
        (item) => item.name === file.name && item.size === file.size
      );
      if (!duplicate) next.push(file);
    }

    setFiles(next.slice(0, 5));
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function send() {
    if (!canSend) return;
    const text = input.trim();
    const attachments = [...files];
    const useWebSearch = webSearchAvailable && webSearch;
    setInput("");
    setFiles([]);
    setAttachError("");
    setDictateError("");
    await onSend?.(text, attachments, {
      webSearch: useWebSearch,
      model: selectedModel || null,
    });
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  function cancelDictate() {
    finishingRef.current = false;
    recorderRef.current?.cancel();
    recorderRef.current = null;
    setDictating(false);
    setTranscribing(false);
    setBars(Array(WAVE_BARS).fill(0.12));
  }

  async function finishDictate() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setDictating(false);

    if (!recorder) {
      finishingRef.current = false;
      return;
    }

    setTranscribing(true);
    setDictateError("");

    try {
      const blob = await recorder.stop();
      if (!blob || blob.size < 44 + 16000 * 0.25 * 2) {
        setDictateError("Didn't catch that. Try speaking again.");
        return;
      }

      const result = await transcribeWav(blob);
      const text = String(result?.text || "").trim();
      if (!text) {
        setDictateError("Didn't catch that. Try speaking again.");
        return;
      }

      setInput((prev) => appendTranscript(prev, text));
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.selectionStart = el.value.length;
        el.selectionEnd = el.value.length;
      });
    } catch (error) {
      setDictateError(describeVoiceError(error));
    } finally {
      finishingRef.current = false;
      setTranscribing(false);
      setBars(Array(WAVE_BARS).fill(0.12));
    }
  }

  finishDictateRef.current = finishDictate;

  async function toggleDictate() {
    if (transcribing || busy) return;
    if (dictating) {
      await finishDictate();
      return;
    }

    setDictateError("");
    try {
      const recorder = await startWavRecorder({
        maxSeconds: MAX_STT_SECONDS,
        onLimit: () => finishDictateRef.current?.(),
      });
      recorderRef.current = recorder;
      setDictating(true);
    } catch (error) {
      setDictateError(describeVoiceError(error));
    }
  }

  const placeholder = dictating
    ? "Listening…"
    : transcribing
      ? "Transcribing…"
      : files.length
        ? "Add a question about the attached file(s)..."
        : "Ask anything about Pakistani law...";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col rounded-[28px] border border-slate-200/80 bg-white px-3 py-2 shadow-sm">
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 px-1 pt-1">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="flex max-w-full items-center gap-2 rounded-xl bg-[#F7F8FC] px-2.5 py-1.5 text-[12px] text-slate-700"
              >
                <FileText size={13} className="shrink-0 text-amber-600" />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-slate-400">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  disabled={busy || voiceBusy}
                  onClick={() => removeFile(index)}
                  className="rounded-md p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {dictating || transcribing ? (
          <div className="flex min-h-[40px] w-full items-center gap-3 px-2">
            <div className="flex h-8 flex-1 items-center gap-[2px]">
              {bars.map((value, index) => (
                <span
                  key={index}
                  className={`w-[3px] rounded-full ${
                    transcribing ? "bg-slate-300" : "bg-slate-800"
                  }`}
                  style={{
                    height: `${6 + Math.max(0.08, value) * 22}px`,
                  }}
                />
              ))}
            </div>
            <span className="shrink-0 text-[12px] text-slate-400">
              {transcribing ? "Transcribing…" : "Listening…"}
            </span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            aria-label="Message"
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(e) => {
              const pasted = e.clipboardData?.files;
              if (pasted?.length) {
                e.preventDefault();
                addFiles(pasted);
              }
            }}
            placeholder={placeholder}
            className="block min-h-[40px] max-h-40 w-full resize-none overflow-y-hidden border-0 bg-transparent px-2 py-2 text-[15px] leading-[1.55] text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
          />
        )}

        <div className="flex w-full items-center justify-between pb-1">
          <div className="flex items-center gap-1">
            {modelOptions.length > 1 && (
              <div ref={modelPickerRef} className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={modelPickerOpen}
                  aria-label={`Choose model. Current model: ${activeModel?.name || selectedModel}`}
                  disabled={busy || voiceBusy}
                  onClick={() => setModelPickerOpen((open) => !open)}
                  className="flex h-8 max-w-[210px] items-center gap-1.5 rounded-xl px-2.5 text-[12px] font-medium text-slate-600 transition hover:bg-white/70 hover:text-slate-900 disabled:opacity-50"
                  title={activeModel?.description || "Choose a model for your next answer"}
                >
                  <Sparkles size={14} className="shrink-0 text-blue-500" />
                  <span className="truncate">{activeModel?.name || "Model"}</span>
                  <ChevronDown
                    size={12}
                    className={`shrink-0 text-slate-400 transition-transform ${modelPickerOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {modelPickerOpen && (
                  <div
                    role="menu"
                    aria-label="Choose a chat model"
                    className="context-glass-panel absolute bottom-full left-0 z-30 mb-3 w-[min(320px,calc(100vw-2.5rem))] rounded-2xl border p-2 text-left"
                  >
                    <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">
                      Choose a model
                    </p>
                    {modelOptions.map((model) => {
                      const selected = model.id === selectedModel;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={selected}
                          onClick={() => {
                            setSelectedModel(model.id);
                            window.localStorage.setItem(
                              "juris.selectedChatModel",
                              model.id
                            );
                            setModelPickerOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                            selected
                              ? "bg-blue-500/10 text-blue-900"
                              : "text-slate-700 hover:bg-white/60"
                          }`}
                        >
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selected ? "bg-blue-500/12 text-blue-600" : "bg-white/65 text-slate-500"}`}>
                            <Sparkles size={15} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-[13px] font-semibold">
                              <span className="truncate">{model.name}</span>
                              {model.is_default && (
                                <span className="shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                                  Default
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                              {model.description}
                            </span>
                          </span>
                          {selected && <Check size={15} className="shrink-0 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_UPLOAD_TYPES}
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={busy || voiceBusy}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              title="Attach PDF or text file"
            >
              <Paperclip size={16} />
            </button>
            {webSearchAvailable && (
              <button
                type="button"
                disabled={busy || voiceBusy}
                onClick={() => setWebSearch((prev) => !prev)}
                title={
                  webSearch
                    ? `Web search on${webSearchProvider ? ` (${webSearchProvider})` : ""}`
                    : "Include live web search"
                }
                className={`flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] transition disabled:opacity-50 ${
                  webSearch
                    ? "bg-slate-900 text-white hover:bg-black"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Globe size={14} />
                <span className="hidden sm:inline">Web</span>
              </button>
            )}
            <ContextUsageIndicator tokenBudget={tokenBudget} />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={busy || transcribing}
              onClick={toggleDictate}
              title={
                dictating
                  ? "Stop dictation"
                  : transcribing
                    ? "Transcribing…"
                    : mic.reason === "insecure"
                      ? "Microphone needs HTTPS (localhost or https://)"
                      : mic.ok
                        ? "Dictate"
                        : "Microphone is not available in this browser"
              }
              className={`flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-50 ${
                dictating
                  ? "bg-slate-900 text-white hover:bg-black"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Mic size={16} />
            </button>

            {busy ? (
              <button
                type="button"
                onClick={onStop}
                disabled={uploading}
                className="primary-action flex h-8 w-8 items-center justify-center rounded-full text-white transition disabled:opacity-50"
                title={uploading ? "Uploading…" : "Stop request"}
              >
                <Square size={11} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canSend}
                onClick={send}
                className="primary-action flex h-8 w-8 items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <ArrowUp size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {(attachError || dictateError) && (
        <p className="mt-2 text-center text-[11px] text-red-600">
          {dictateError || attachError}
        </p>
      )}

      <p className="mt-2.5 text-center text-[11px] text-slate-400">
        {uploading
          ? "Uploading and indexing document(s)…"
          : dictating
            ? "Listening… tap the mic to stop. Esc cancels."
            : transcribing
              ? "Turning speech into text…"
              : "Attach PDF/text with the paperclip. Chat uploads stay in this conversation; matter uploads go on the matter page."}
      </p>
    </div>
  );
}
