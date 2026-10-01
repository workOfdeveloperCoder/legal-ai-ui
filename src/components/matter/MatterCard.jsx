import { Folder, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { chatService } from "../../services/chatService";
import { matterService } from "../../services/matterService";
import { useNavigate } from "react-router-dom";

import dayjs from "dayjs";

export default function MatterCard({ matter, onClose, onMatterChanged }) {

    const [open, setOpen] = useState(false)
    const menuRef = useRef(null);
    const [availableConversation, setAvailableConversation] = useState(null);
    const [showSubmenu, setShowSubmenu] = useState(false);
    const [submenuPosition, setSubmenuPosition] = useState("right");
    const [actionBusy, setActionBusy] = useState(false);
    const [menuError, setMenuError] = useState("");
    const submenuRef = useRef(null);
    const navigate = useNavigate();

    async function loadUnlistedConversations() {

        setMenuError("");
        try {
            const data = await chatService.getAvailableConversations(matter.id);
            setAvailableConversation(data);
            setOpen(true);
        } catch (error) {
            setMenuError(error?.message || "Could not load conversations.");
            setOpen(true);
        }
    }

    async function renameMatter() {
        const title = window.prompt("Rename matter", matter.title);
        if (title == null || !title.trim()) return;
        setActionBusy(true);
        setMenuError("");
        try {
            await matterService.updateMatter(matter.id, { title: title.trim() });
            setOpen(false);
            onMatterChanged?.();
        } catch (error) {
            setMenuError(error?.message || "Could not rename matter.");
        } finally { setActionBusy(false); }
    }

    async function toggleArchive() {
        setActionBusy(true);
        setMenuError("");
        try {
            await matterService.updateMatter(matter.id, {
                status: matter.status === "archived" ? "active" : "archived",
            });
            setOpen(false);
            onMatterChanged?.();
        } catch (error) {
            setMenuError(error?.message || "Could not update matter status.");
        } finally { setActionBusy(false); }
    }

    async function deleteMatter() {
        if (!window.confirm(`Delete matter “${matter.title}”? This cannot be undone.`)) return;
        setActionBusy(true);
        setMenuError("");
        try {
            await matterService.deleteMatter(matter.id);
            setOpen(false);
            onMatterChanged?.();
        } catch (error) {
            setMenuError(error?.message || "Could not delete matter.");
        } finally { setActionBusy(false); }
    }

    async function linkConversation(conversation) {
        setActionBusy(true);
        setMenuError("");
        try {
            await chatService.setConversationMatter(conversation.id, matter.id);
            setOpen(false);
            onMatterChanged?.();
        } catch (error) {
            setMenuError(error?.message || "Could not link conversation.");
        } finally { setActionBusy(false); }
    }

    useEffect(() => {

        if (!showSubmenu) return;

        requestAnimationFrame(() => {

            if (!submenuRef.current) return;

            const rect = submenuRef.current.getBoundingClientRect();

            if (rect.right > window.innerWidth) {
                setSubmenuPosition("left");
            } else if (rect.left < 0) {
                setSubmenuPosition("right");
            }

        });

    }, [showSubmenu]);

    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setOpen(false);
            }

        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };

    }, []);
    

    return (

        <motion.div

            layout

            whileHover={{
                y:-6,
                scale:1.01
            }}

            whileTap={{
                scale:.98
            }}

            transition={{
                type:"spring",
                stiffness:400,
                damping:25
            }}
            className="matter-card-glass group rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg "
        >

            {/* Header */}

            <div className="p-5">

                <div className="flex items-start gap-3">

                    <Folder
                        size={20}
                        className="mt-0.5 fill-[#007AFF] text-[#007AFF]"
                    />

                    <div className="flex-1">

                        <h3 className="text-[15px] font-semibold text-slate-900">

                            {matter.title}

                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">

                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">

                                {matter.category}

                            </span>

                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">

                                {matter.court}

                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {/* Stats */}

            <div className="flex justify-between px-5 pb-4 text-center">

                <div>

                    <p className="text-sm font-semibold text-slate-900">
                        {matter.conversations.length}
                    </p>

                    <p className="text-[11px] text-slate-500">
                        Chats
                    </p>

                </div>

                <div>

                    <p className="text-sm font-semibold text-slate-900">
                        {matter.documents.length}
                    </p>

                    <p className="text-[11px] text-slate-500">
                        Documents
                    </p>

                </div>

                <div>

                    <p className="text-sm font-semibold text-slate-900">
                        {matter.tasks.length}
                    </p>

                    <p className="text-[11px] text-slate-500">
                        Tasks
                    </p>

                </div>

            </div>

            <div className="border-t border-slate-100"></div>

            {/* Hearing */}

            <div className="flex items-center justify-between px-5 py-4">

                <p className="text-sm text-slate-500">

                    Next Hearing

                </p>

                <p className="text-sm font-medium text-slate-800">

                    {matter.nextHearing && dayjs(matter.nextHearing).isValid()
                        ? dayjs(matter.nextHearing).format("DD MMM YYYY")
                        : "No hearing scheduled"}

                </p>

            </div>

            <div className="border-t border-slate-100"></div>

            {/* Footer */}

            <div className="flex items-center justify-between p-4">

                <span className="text-[11px] text-slate-500">

                    Updated {matter.updatedAt}

                </span>

                <div className="flex items-center gap-2">

                    <button
                        onClick={() => {navigate(`/matter/${matter.id}`);onClose?.();}}
                        className="cursor-pointer rounded-md border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Open Matter
                    </button>

                    <div  ref={menuRef} className="relative">
                        <button
                            onClick={() => loadUnlistedConversations()}
                            aria-label={`Actions for ${matter.title}`}
                            className="rounded-md border border-slate-200 p-2 hover:bg-slate-50 "
                        >
                            <MoreHorizontal size={15}/>
                        </button>

                        <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0.95,
                                    y: -8
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.95,
                                    y: -8
                                }}
                                transition={{
                                    duration: 0.15,
                                    ease: "easeOut"
                                }}
                                className="popover-panel right-0 top-10 w-56 text-sm text-slate-600"
                            >
                                {menuError && <p role="alert" className="px-4 py-2 text-xs text-red-600">{menuError}</p>}
                                <button disabled={actionBusy} onClick={() => void renameMatter()} className="w-full px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-50">
                                    Rename
                                </button>

                                <button disabled={actionBusy} onClick={() => void toggleArchive()} className="w-full px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-50">
                                    {matter.status === "archived" ? "Restore" : "Archive"}
                                </button>

                                <button disabled={actionBusy} onClick={() => void deleteMatter()} className="w-full px-4 py-3 text-left text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                                    Delete
                                </button>

                                <div className="border-t border-slate-100"/>


                                {/* Hover submenu */}
                                <div
                                    className="relative"
                                    onMouseEnter={() => setShowSubmenu(true)}
                                    onMouseLeave={() => setShowSubmenu(false)}
                                >

                                    <button type="button" aria-expanded={showSubmenu} onClick={() => setShowSubmenu((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50">
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
                                                    x: submenuPosition === "right" ? -8 : 8
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    x: 0
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.95,
                                                    x: submenuPosition === "right" ? -8 : 8
                                                }}
                                                transition={{
                                                    duration: 0.15
                                                }}
                                                className={`
                                                    absolute
                                                    top-0
                                                    z-50
                                                    w-72
                                                    rounded-xl
                                                    border
                                                    border-slate-200
                                                    bg-white
                                                    shadow-xl
                                                    ${
                                                        submenuPosition === "right"
                                                            ? "left-full ml-1"
                                                            : "right-full mr-1"
                                                    }
                                                `}
                                            >

                                                    {(availableConversation || []).map(conversation => (

                                                    <button
                                                        key={conversation.id}
                                                        onClick={() => void linkConversation(conversation)}
                                                        disabled={actionBusy}
                                                        className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-50"
                                                    >

                                                        <div>

                                                            <p className="text-sm font-medium">
                                                                {conversation.title}
                                                            </p>

                                                            <p className="text-xs text-slate-500">
                                                                Conversation
                                                            </p>

                                                        </div>

                                                        {conversation.matter?.id === matter.id && (
                                                            <span className="text-green-600">
                                                                ✓
                                                            </span>
                                                        )}

                                                    </button>

                                                ))}
                                                {availableConversation?.length === 0 && <p className="px-4 py-3 text-xs text-slate-500">No unlinked conversations.</p>}

                                            </motion.div>

                                        )}

                                    </AnimatePresence>

                                </div>

                            </motion.div>

                        )}
                        </AnimatePresence>
                    </div>

                </div>

            </div>

        </motion.div>

    );

}
