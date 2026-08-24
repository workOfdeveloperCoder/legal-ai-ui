import { Paperclip, Mic, ArrowUp, Square, X, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ACCEPTED_UPLOAD_TYPES,
  isAllowedUploadFile,
  MAX_UPLOAD_BYTES,
} from "../../services/documentService";
import { MAX_STT_SECONDS, startWavRecorder } from "../../lib/recordWav";
import {
  describeVoiceError,
  transcribeWav,
} from "../../services/voiceService";
import ContextUsageIndicator from "./ContextUsageIndicator";

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
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const recorderRef = useRef(null);
  const finishingRef = useRef(false);
  const finishDictateRef = useRef(null);

  const busy = loading || uploading;
  const voiceBusy = dictating || transcribing;
  const canSend = Boolean(input.trim() || files.length) && !busy && !voiceBusy;

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
    setInput("");
    setFiles([]);
    setAttachError("");
    setDictateError("");
    await onSend?.(text, attachments);
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
      <div className="rounded-[28px] border border-slate-200/80 bg-white px-3 py-2 shadow-sm flex">
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
          <div className="flex min-h-[40px] w-[50%] items-center gap-3 px-2">
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
            className="max-h-40 min-h-[40px] w-[50%] resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-[1.55] text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
          />
        )}

        <div className="flex w-[50%] items-center justify-end pb-1">
          <div className="flex items-center gap-1">
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
                    : "Dictate"
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
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-black disabled:opacity-50"
                title={uploading ? "Uploading…" : "Stop request"}
              >
                <Square size={11} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canSend}
                onClick={send}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-300"
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
