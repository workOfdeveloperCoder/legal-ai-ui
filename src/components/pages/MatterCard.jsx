import { Folder, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { useState, useEffect, useRef } from "react";
import { chatService } from "../../services/chatService";


export default function MatterCard({ key, matter, setActivePage }) {

    const [open, setOpen] = useState(false)
    const menuRef = useRef(null);
    const [availableConversation, setAvailableConversation] = useState(null);
    const [showSubmenu, setShowSubmenu] = useState(false);
    const [submenuPosition, setSubmenuPosition] = useState("right");
    const submenuRef = useRef(null);

    async function loadUnlistedConversations(matterId) {

        const data = await chatService.getAvailableConversations();
        setAvailableConversation(data)
        setOpen(true)
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
            className="group rounded-xl border border-[#ECECEC] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg "
        >

            {/* Header */}

            <div className="p-5">

                <div className="flex items-start gap-3">

                    <Folder
                        size={20}
                        className="mt-0.5 fill-[#EAB308] text-[#EAB308]"
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

                    {dayjs(matter.nextHearing).format("DD MMM YYYY")}

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
                        onClick={() => setActivePage(`/matter/${matter.id}`)}
                        className="cursor-pointer rounded-md border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Open Matter
                    </button>

                    <div  ref={menuRef} className="relative">
                        <button
                            onClick={() => loadUnlistedConversations(matter.id)}
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
                                className="absolute right-0 top-10 w-56 text-sm text-slate-500 rounded-xl border border-[#ECECEC] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <button className="w-full px-4 py-3 text-left hover:bg-slate-50">
                                    Rename
                                </button>

                                <button className="w-full px-4 py-3 text-left hover:bg-slate-50">
                                    Delete
                                </button>

                                <div className="border-t border-slate-100"/>


                                {/* Hover submenu */}
                                <div
                                    className="relative"
                                    onMouseEnter={() => setShowSubmenu(true)}
                                    onMouseLeave={() => setShowSubmenu(false)}
                                >

                                    <button className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50">
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

                                                {availableConversation?.map(conversation => (

                                                    <button
                                                        key={conversation.id}
                                                        className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
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