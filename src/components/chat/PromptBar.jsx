import { Paperclip, Mic, ArrowUp, Square, X, FileText } from "lucide-react";
import { useRef, useState } from "react";
import {
  ACCEPTED_UPLOAD_TYPES,
  isAllowedUploadFile,
  MAX_UPLOAD_BYTES,
} from "../../services/documentService";
import ContextUsageIndicator from "./ContextUsageIndicator";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const fileInputRef = useRef(null);

  const busy = loading || uploading;
  const canSend = Boolean(input.trim() || files.length) && !busy;

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
    await onSend?.(text, attachments);
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
                  disabled={busy}
                  onClick={() => removeFile(index)}
                  className="rounded-md p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
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
          placeholder={
            files.length
              ? "Add a question about the attached file(s)..."
              : "Ask anything about Pakistani law..."
          }
          className="max-h-40 min-h-[44px] w-full resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-[1.55] text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
        />

        <div className="flex items-center justify-between pb-1">
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
              disabled={busy}
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
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
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

      {attachError && (
        <p className="mt-2 text-center text-[11px] text-red-600">{attachError}</p>
      )}

      <p className="mt-2.5 text-center text-[11px] text-slate-400">
        {uploading
          ? "Uploading and indexing document(s)…"
          : "Attach PDF/text with the paperclip. Chat uploads stay in this conversation; matter uploads go on the matter page."}
      </p>
    </div>
  );
}
