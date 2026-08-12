import { useRef, useState } from "react";
import {
  ChevronRight,
  Upload,
  Plus,
  FileText,
  MessageSquare,
  CheckSquare,
  Star,
} from "lucide-react";
import {
  ACCEPTED_UPLOAD_TYPES,
  documentService,
} from "../../services/documentService";

export default function MatterHeader({
  matter = null,
  matterId = null,
  onUploaded,
  onNewChat,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadInfo, setUploadInfo] = useState("");

  const displayTitle = matter?.title || "Matter";
  const chats = matter?.conversations?.length ?? 0;
  const documents = matter?.documents?.length ?? 0;
  const tasks = matter?.tasks?.length ?? 0;

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
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[30px] font-semibold text-[#202124]">
              {displayTitle}
            </h1>
            <Star size={18} className="fill-[#F6B73C] text-[#F6B73C]" />
          </div>

          <div className="mt-2 flex items-center gap-4 text-[14px] text-[#6C7280]">
            <span>{matter?.status || "Active"}</span>
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

        <div className="flex items-center gap-4">
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
            disabled={!matterId || uploading}
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
