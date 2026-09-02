import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { chatService } from "../../services/chatService";
import { matterService } from "../../services/matterService";

export default function MattersMenu({
  selectedConversation,
  onClose,
  onConversationsChange,
}) {
  const [availableMatters, setAvailableMatters] = useState([]);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState("right");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const menuRef = useRef(null);
  const submenuRef = useRef(null);
  const renameInputRef = useRef(null);

  const navigate = useNavigate();
  const params = useParams();

  const conversation = selectedConversation?.conversation || null;

  useEffect(() => {
    if (!selectedConversation) {
      setRenaming(false);
      setError("");
      setBusy(false);
      return;
    }

    async function load() {
      const rect = selectedConversation.anchor.getBoundingClientRect();
      const width = 224;
      const left = Math.min(
        window.innerWidth - width - 12,
        Math.max(12, rect.right - width)
      );

      setMenuPosition({
        top: rect.bottom + 6,
        left,
      });
      setRenameValue(selectedConversation.conversation?.title || "");
      setRenaming(false);
      setError("");

      try {
        const data = await matterService.getAvailableMatters(
          selectedConversation.conversation.id
        );
        setAvailableMatters(data || []);
      } catch {
        setAvailableMatters([]);
      }
    }

    load();
  }, [selectedConversation]);

  useEffect(() => {
    if (renaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renaming]);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
        setShowSubmenu(false);
        setRenaming(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  async function handleRenameSubmit() {
    if (!conversation || busy) return;
    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      setError("Title cannot be empty.");
      return;
    }
    if (nextTitle === conversation.title) {
      setRenaming(false);
      return;
    }

    setBusy(true);
    setError("");
    try {
      await chatService.renameConversation(conversation.id, nextTitle);
      onConversationsChange?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Could not rename conversation.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!conversation || busy) return;
    const confirmed = window.confirm(
      `Delete “${conversation.title || "this conversation"}”? This cannot be undone.`
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    try {
      const id = String(conversation.id);
      await chatService.deleteConversation(id);
      onConversationsChange?.();
      onClose();

      const openId = params.conversationId;
      if (openId && String(openId) === id) {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err?.message || "Could not delete conversation.");
      setBusy(false);
    }
  }

  async function handleTogglePin() {
    if (!conversation || busy) return;
    setBusy(true);
    setError("");
    try {
      await chatService.setConversationPinned(
        conversation.id,
        !conversation.isPinned
      );
      onConversationsChange?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Could not update pin.");
      setBusy(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      {selectedConversation && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.96, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -5 }}
          className="fixed z-[9999] w-56 rounded-xl border border-slate-200 bg-white shadow-xl"
          style={menuPosition}
        >
          {renaming ? (
            <div className="p-3">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Rename
              </label>
              <input
                ref={renameInputRef}
                value={renameValue}
                disabled={busy}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleRenameSubmit();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setRenaming(false);
                    setError("");
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                maxLength={120}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRenameSubmit()}
                  className="flex-1 rounded-lg bg-[#23232F] px-2 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setRenaming(false);
                    setError("");
                  }}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setRenameValue(conversation?.title || "");
                  setRenaming(true);
                  setError("");
                }}
                className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                Rename
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleTogglePin()}
                className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                {conversation?.isPinned ? "Unpin" : "Pin"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete()}
                className="w-full rounded-xl px-4 py-3 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                Delete
              </button>
            </>
          )}

          {error && (
            <p className="border-t border-slate-100 px-4 py-2 text-[12px] text-rose-600">
              {error}
            </p>
          )}

          {!renaming && (
            <>
              <div className="border-t border-slate-100" />

              <div
                className="relative"
                onMouseEnter={() => setShowSubmenu(true)}
                onMouseLeave={() => setShowSubmenu(false)}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50"
                >
                  <span>Link Conversation</span>
                  ▶
                </button>

                <AnimatePresence>
                  {showSubmenu && (
                    <motion.div
                      ref={submenuRef}
                      initial={{
                        opacity: 0,
                        scale: 0.95,
                        x: submenuPosition === "right" ? -8 : 8,
                      }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        x: submenuPosition === "right" ? -8 : 8,
                      }}
                      transition={{ duration: 0.15 }}
                      className={`absolute top-0 z-50 w-72 rounded-xl border border-slate-200 bg-white shadow-xl ${
                        submenuPosition === "right"
                          ? "left-full ml-1"
                          : "right-full mr-1"
                      }`}
                    >
                      {(availableMatters || []).length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500">
                          No matters available.
                        </p>
                      ) : (
                        availableMatters.map((matter) => (
                          <button
                            key={matter.id}
                            type="button"
                            className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {matter.title}
                              </p>
                              <p className="text-xs text-slate-500">Matter</p>
                            </div>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
