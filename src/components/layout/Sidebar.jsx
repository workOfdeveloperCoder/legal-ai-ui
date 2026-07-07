import { Plus, Folder, MessageSquare, Settings, Scale } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";

export default function Sidebar({
    activePage,
    setActivePage,
    conversations,
    selectedConversationId,
    onSelect,
}) {

    function openConversation(conversation) {
        onSelect(conversation.id);
        setActivePage(`/conversation/${conversation.id}`);
    }

    return (

        <div className="w-[280px] h-full shrink-0 bg-[#23232F] border-r border-white/5 flex flex-col">

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

                <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow py-3 hover:bg-yellow">

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
                            className="relative mx-3 mb-2 cursor-pointer overflow-hidden rounded-xl"
                        >
                            {activePage === `/conversation/${conversation.id}` && (
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
                                        activePage === `/conversation/${conversation.id}`
                                            ? "text-yellow-400"
                                            : ""
                                    }
                                />

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">
                                        {conversation.title}
                                    </p>

                                    <p className="truncate text-xs text-yellow-300">
                                        {conversation.matter.title}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                </div>

            </LayoutGroup>

            {/* Bottom */}

            <div className="border-t border-white/5 p-4">

                <button
                    onClick={() => setActivePage("/matters")}
                    className={`cursor-pointer flex w-full items-center gap-3 rounded-xl px-4 py-3 transition
                        ${
                            activePage === "/matters"
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

    );

}