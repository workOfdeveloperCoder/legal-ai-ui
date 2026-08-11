import {
    Plus,
    Folder,
    MessageSquare,
    Settings,
    Scale,
    MoreHorizontal,
    LayoutDashboard,
} from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { chatService } from "../../services/chatService";
import MattersMenu from "../menu/MattersMenu";

export default function Sidebar({
    conversations,
    onSelect,
    onConversationsChange,
    isOpen,
    onClose,
}) {
    const [selectedConversation, setSelectedConversation] = useState(null);

    const navigate = useNavigate();
    const { pathname } = useLocation();

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
                bg-[#23232F]
                border-r border-white/5
                flex flex-col
                transition-transform duration-300

                ${isOpen ? "d-none" : "d-block"}

                min-[1000px]:static
                min-[1000px]:h-full
                min-[1000px]:translate-x-0
                min-[1000px]:shrink-0
            `} >

                {/* Logo */}
                
                <div className="p-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow">

                            <Scale />

                        </div>

                        <div>

                            <h1 className="font-bold text-white">
                                Legal AI
                            </h1>

                            <p className="text-xs text-gray-400">
                                Pakistan Assistant
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
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow py-3 hover:bg-yellow"
                    >

                        <Plus size={18} />

                        New Chat

                    </button>

                </div>

                {/* Recent */}

                <div className="px-4 text-xs uppercase text-gray-500">

                    Recent Chats

                </div>

                <LayoutGroup>

                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto hide-scrollbar">

                        {conversations.map((conversation) => (
                            <motion.div
                                key={conversation.id}
                                layout
                                onClick={() => openConversation(conversation)}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative mx-3 mb-2 group-hover:opacity-100 hover:bg-white/10 cursor-pointer overflow-hidden rounded-xl"
                            >
                                {pathname === `/conversation/${conversation.id}` && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 rounded-xl bg-white/10"
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 38,
                                        }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-3 px-4 py-3">
                                    <MessageSquare
                                        size={16}
                                        className={
                                            pathname === `/conversation/${conversation.id}`
                                                ? "text-yellow-400"
                                                : ""
                                        }
                                    />

                                <div className="min-w-0 flex-1">

                                        <div className="flex items-center justify-between">

                                            <p className="truncate text-sm font-medium text-white">
                                                {conversation.title}
                                            </p>

                                            <div className="relative" >

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedConversation({ anchor: e.currentTarget, conversation});
                                                    }}
                                                    className="rounded-lg p-1 opacity-0 transition group-hover:opacity-100 hover:bg-white/10"
                                                >
                                                <MoreHorizontal size={16} className="text-gray-300" />

                                                </button>
                                        
                                            </div>
                                        

                                        </div>

                                        <p className="truncate text-xs text-yellow-300">
                                            {conversation.matter?.title}
                                        </p>

                                    </div>
                                </div>
                                
                            </motion.div>
                        ))}
                        <MattersMenu
                            selectedConversation={selectedConversation}
                            onClose={() => setSelectedConversation(null)}
                        />
                    </div>

                </LayoutGroup>

                {/* Bottom */}

                <div className="border-t border-white/5 p-4">

                    <button
                        onClick={() => {navigate("/dashboard"); onClose?.();}}
                        className={`
                            flex w-full items-center gap-3 rounded-xl px-4 py-3 transition
                            ${
                                pathname === "/dashboard"
                                    ? "bg-white/10 text-white"
                                    : "text-gray-300 hover:bg-white/5"
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
                                    ? "bg-background/10 text-white"
                                    : "text-gray-300 hover:bg-background/5"
                            }`}
                    >

                        <Folder size={18} />

                        Matters

                    </button>

                    <button
                        className="cursor-pointer mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-300 hover:bg-background/5"
                    >

                        <Settings size={18} />

                        Settings

                    </button>

                </div>

            </div>

        </>

    );

}