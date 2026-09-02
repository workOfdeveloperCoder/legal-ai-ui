import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Upload,
  Plus,
  FileText,
  MessageSquare,
  CheckSquare,
  Star,
  Archive,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  ACCEPTED_UPLOAD_TYPES,
  documentService,
} from "../../services/documentService";
import { matterService } from "../../services/matterService";

export default function MatterHeader({
  matter = null,
  matterId = null,
  onUploaded,
  onNewChat,
  onMatterUpdated,
  onMatterDeleted,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadInfo, setUploadInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const displayTitle = matter?.title || "Matter";
  const chats = matter?.conversations?.length ?? 0;
  const documents = matter?.documents?.length ?? 0;
  const tasks = matter?.tasks?.length ?? 0;
  const isPinned = Boolean(matter?.isPinned);
  const isArchived =
    String(matter?.status || "").toLowerCase() === "archived";

  useEffect(() => {
    setTitleDraft(matter?.title || "");
    setEditing(false);
  }, [matter?.id, matter?.title]);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length || !matterId) return;

    setUploading(true);
    setUploadError("");
    setUploadInfo("");

    try {
      const uploaded = await documentService.uploadManyToMatter(matterId, files);
      setUploadInfo(
        `Uploaded ${uploaded.length} file${uploaded.length > 1 ? "s" : ""} to this matter.`
      );
      onUploaded?.(uploaded);
    } catch (error) {
      console.error(error);
      setUploadError(error?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  }

  async function saveTitle() {
    if (!matterId || busy) return;
    const next = titleDraft.trim();
    if (!next) {
      setUploadError("Title cannot be empty.");
      return;
    }
    if (next === matter?.title) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setUploadError("");
    try {
      const updated = await matterService.updateMatter(matterId, {
        title: next,
      });
      onMatterUpdated?.(updated);
      setEditing(false);
    } catch (error) {
      setUploadError(error?.message || "Could not rename matter.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePin() {
    if (!matterId || busy) return;
    setBusy(true);
    setUploadError("");
    try {
      const updated = await matterService.updateMatter(matterId, {
        isPinned: !isPinned,
      });
      onMatterUpdated?.(updated);
    } catch (error) {
      setUploadError(error?.message || "Could not update pin.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleArchive() {
    if (!matterId || busy) return;
    setBusy(true);
    setUploadError("");
    try {
      const updated = await matterService.updateMatter(matterId, {
        status: isArchived ? "active" : "archived",
      });
      onMatterUpdated?.(updated);
    } catch (error) {
      setUploadError(error?.message || "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!matterId || busy) return;
    const confirmed = window.confirm(
      `Delete matter “${displayTitle}”? This cannot be undone.`
    );
    if (!confirmed) return;
    setBusy(true);
    setUploadError("");
    try {
      await matterService.deleteMatter(matterId);
      onMatterDeleted?.();
    } catch (error) {
      setUploadError(error?.message || "Could not delete matter.");
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-[#ECECEC] bg-white px-8 py-5">
      <div className="mb-4 flex items-center gap-2 text-[13px] text-[#8B8B96]">
        <span>Home</span>
        <ChevronRight size={14} />
        <span>Matters</span>
        <ChevronRight size={14} />
        <span className="font-medium text-[#444]">{displayTitle}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={titleDraft}
                  disabled={busy}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveTitle();
                    }
                    if (e.key === "Escape") {
                      setEditing(false);
                      setTitleDraft(matter?.title || "");
                    }
                  }}
                  className="min-w-[220px] rounded-xl border border-slate-200 px-3 py-2 text-[22px] font-semibold text-[#202124] outline-none focus:border-slate-400"
                  maxLength={120}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveTitle()}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false);
                    setTitleDraft(matter?.title || "");
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-[30px] font-semibold text-[#202124]">
                  {displayTitle}
                </h1>
                <button
                  type="button"
                  disabled={busy || !matterId}
                  onClick={() => void togglePin()}
                  title={isPinned ? "Unpin matter" : "Pin matter"}
                  className="rounded-lg p-1.5 text-[#F6B73C] hover:bg-amber-50 disabled:opacity-50"
                >
                  <Star
                    size={18}
                    className={isPinned ? "fill-[#F6B73C]" : ""}
                  />
                </button>
                <button
                  type="button"
                  disabled={busy || !matterId}
                  onClick={() => setEditing(true)}
                  title="Rename matter"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[14px] text-[#6C7280]">
            <span className="capitalize">{matter?.status || "Active"}</span>
            {matter?.nextHearing && (
              <>
                <span>•</span>
                <span>Next Hearing {matter.nextHearing}</span>
              </>
            )}
          </div>

          {(uploadError || uploadInfo) && (
            <p
              className={`mt-2 text-sm ${
                uploadError ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {uploadError || uploadInfo}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex gap-3">
            <Stat
              icon={<FileText size={15} />}
              value={`${documents} Documents`}
            />
            <Stat
              icon={<MessageSquare size={15} />}
              value={`${chats} Chats`}
            />
            <Stat
              icon={<CheckSquare size={15} />}
              value={`${tasks} Tasks`}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_UPLOAD_TYPES}
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            disabled={!matterId || uploading || busy}
            onClick={() => void toggleArchive()}
            className="flex h-11 items-center gap-2 rounded-xl border border-[#E4E4E7] px-4 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            title={isArchived ? "Restore matter" : "Archive matter"}
          >
            <Archive size={16} />
            {isArchived ? "Restore" : "Archive"}
          </button>

          <button
            type="button"
            disabled={!matterId || busy}
            onClick={() => void handleDelete()}
            className="flex h-11 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} />
            Delete
          </button>

          <button
            type="button"
            disabled={!matterId || uploading || busy}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 items-center gap-2 rounded-xl border border-[#E4E4E7] px-5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? "Uploading…" : "Upload"}
          </button>

          <button
            type="button"
            onClick={onNewChat}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#F6B73C] px-5 text-sm font-semibold text-black hover:brightness-95"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-xl border border-[#ECECEC] bg-white px-4">
      <div className="text-[#777]">{icon}</div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
