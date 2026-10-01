import {
    Plus,
    Folder,
    MessageSquare,
    UserRound,
    Scale,
    MoreHorizontal,
    LayoutDashboard,
    Pin,
} from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { chatService } from "../../services/chatService";
import MattersMenu from "../menu/MattersMenu";
import TokenUsageCard from "../dashboard/TokenUsageCard";
import { apiRequest } from "../../lib/apiClient";

export default function Sidebar({
    conversations,
    onSelect,
    onConversationsChange,
    isOpen,
    onClose,
}) {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [matters, setMatters] = useState([]);

    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        let active = true;
        apiRequest("/matters", { method: "GET" }).then((data) => { if (active) setMatters(Array.isArray(data) ? data : data?.items || []); }).catch(() => {});
        return () => { active = false; };
    }, [pathname]);

    const sortedConversations = useMemo(() => {
        const list = Array.isArray(conversations) ? [...conversations] : [];
        list.sort((a, b) => {
            const pinDelta = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
            if (pinDelta !== 0) return pinDelta;
            return 0;
        });
        return list;
    }, [conversations]);

    function openConversation(conversation) {
        onSelect?.(conversation.id);
        navigate(`/conversation/${conversation.id}`);
        onClose?.();

    }

    return (
        <>
            <div
                onClick={onClose}
                className={`fixed inset-0 z-40 bg-black/50 min-[1000px]:hidden transition-opacity ${
                    isOpen
                        ? "opacity-100"
                        : "pointer-events-none opacity-0"
                }`}
            />

            <div  className={`
                fixed left-0 top-0 z-50
                h-screen w-[280px]
                app-sidebar-material
                border-r border-slate-200/80
                flex flex-col
                transition-transform duration-300

                ${isOpen ? "translate-x-0" : "-translate-x-full"}

                min-[1000px]:static
                min-[1000px]:h-full
                min-[1000px]:translate-x-0
                min-[1000px]:shrink-0
            `} >

                {/* Logo */}
                
                <div className="p-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#007AFF] shadow-sm ring-1 ring-slate-200/80">

                            <Scale size={19} />

                        </div>

                        <div>

                            <h1 className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">
                                Juris
                            </h1>

                            <p className="text-[11px] text-[#6E6E73]">
                                Legal workspace
                            </p>

                        </div>

                    </div>

                    <button
                        onClick={async () => {
                            try {
                                const conversation =
                                    await chatService.createConversation();

                                onSelect?.(conversation.id);
                                onConversationsChange?.();
                                navigate(`/conversation/${conversation.id}`);
                                onClose?.();
                            } catch (error) {
                                console.error(
                                    "Failed to create conversation:",
                                    error
                                );
                            }
                        }}
                        className="primary-action mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium shadow-sm transition hover:shadow"
                    >

                        <Plus size={18} />

                        New Chat

                    </button>

                </div>

                {/* Recent */}

                <div className="px-5 text-[10px] font-semibold uppercase tracking-[.08em] text-[#8E8E93]">

                    Recent Chats

                </div>

                <LayoutGroup>

                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto hide-scrollbar">

                        {sortedConversations.map((conversation) => (
                            <motion.div
                                key={conversation.id}
                                layout
                                onClick={() => openConversation(conversation)}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative mx-2 mb-1 cursor-pointer overflow-hidden rounded-[10px] hover:bg-black/[.045]"
                            >
                                {pathname === `/conversation/${conversation.id}` && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 rounded-[10px] bg-black/[.06]"
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 38,
                                        }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-3 px-4 py-3">
                                    {conversation.isPinned ? (
                                        <Pin
                                            size={14}
                                            className="shrink-0 text-[#007AFF]"
                                        />
                                    ) : (
                                    <MessageSquare
                                        size={16}
                                        className={
                                            pathname === `/conversation/${conversation.id}`
                                                ? "text-[#007AFF]"
                                                : "text-[#8E8E93]"
                                        }
                                    />
                                    )}

                                <div className="min-w-0 flex-1">

                                        <div className="flex items-center justify-between">

                                            <p className="truncate text-[13px] font-medium text-[#1D1D1F]">
                                                {conversation.title}
                                            </p>

                                            <div className="relative" >

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedConversation({ anchor: e.currentTarget, conversation});
                                                    }}
                                                    className="rounded-lg p-1 opacity-0 transition group-hover:opacity-100 hover:bg-black/[.06]"
                                                >
                                                <MoreHorizontal size={16} className="text-[#6E6E73]" />

                                                </button>
                                        
                                            </div>
                                        

                                        </div>

                                        <p className="truncate text-[11px] text-[#8E8E93]">
                                            {conversation.matter?.title}
                                        </p>

                                    </div>
                                </div>
                                
                            </motion.div>
                        ))}
                        {matters.length > 0 && <section className="mx-3 mt-5 border-t border-slate-200 pt-3">
                            <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[.08em] text-[#8E8E93]"><span>Matters</span><button onClick={() => { navigate("/matters"); onClose?.(); }} className="text-[#007AFF] hover:underline">View all</button></div>
                            {matters.slice(0, 8).map((matter) => <div key={matter.id}>
                                <button onClick={() => { navigate(`/matter/${matter.id}`); onClose?.(); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] ${pathname === `/matter/${matter.id}` ? "bg-black/[.06] text-[#1D1D1F]" : "text-[#3A3A3C] hover:bg-black/[.04]"}`}><Folder size={15} className="shrink-0 text-[#007AFF]"/><span className="truncate">{matter.title}</span></button>
                                {sortedConversations.filter((chat) => String(chat.matter?.id) === String(matter.id)).slice(0, 2).map((chat) => <button key={chat.id} onClick={() => openConversation(chat)} className="flex w-full items-center gap-2 truncate py-1.5 pl-9 pr-3 text-left text-[11px] text-[#6E6E73] hover:text-[#1D1D1F]"><MessageSquare size={12}/><span className="truncate">{chat.title}</span></button>)}
                            </div>)}
                        </section>}
                        <MattersMenu
                            selectedConversation={selectedConversation}
                            onClose={() => setSelectedConversation(null)}
                            onConversationsChange={onConversationsChange}
                        />
                    </div>

                </LayoutGroup>

                {/* Bottom */}

                <div className="border-t border-slate-200/80 p-3">

                    <button
                        onClick={() => {navigate("/dashboard"); onClose?.();}}
                        className={`
                            flex w-full items-center gap-3 rounded-xl px-4 py-3 transition
                            ${
                                pathname === "/dashboard"
                                    ? "bg-black/[.06] text-[#1D1D1F]"
                                    : "text-[#6E6E73] hover:bg-black/[.04]"
                            }
                        `}
                    >
                        <LayoutDashboard size={18} />
                        Dashboard
                    </button>

                    <button
                        onClick={() => {navigate("/matters");onClose?.();}}
                        className={`cursor-pointer flex w-full items-center gap-3 rounded-xl px-4 py-3 transition
                            ${
                                pathname === "/matters"
                                ? "bg-black/[.06] text-[#1D1D1F]"
                                : "text-[#6E6E73] hover:bg-black/[.04]"
                            }`}
                    >

                        <Folder size={18} />

                        Matters

                    </button>

                    <button onClick={() => {navigate("/profile"); onClose?.();}}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[#6E6E73] hover:bg-black/[.04]">

                        <UserRound size={18} />

                        Profile

                    </button>

                    <TokenUsageCard variant="sidebar" />

                </div>

            </div>

        </>

    );

}
