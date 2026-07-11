import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

import { matterService } from "../../services/matterService";

export default function MattersMenu({
    selectedConversation,
    onClose,
}) {
    const [availableMatters, setAvailableMatters] = useState([]);
    const [showSubmenu, setShowSubmenu] = useState(false);
    const [submenuPosition, setSubmenuPosition] = useState("right");

    const [menuPosition, setMenuPosition] = useState({
        top: 0,
        left: 0,
    });

    const menuRef = useRef(null);
    const submenuRef = useRef(null);

    useEffect(() => {

        if (!selectedConversation) return;

        async function load() {

            const rect = selectedConversation.anchor.getBoundingClientRect();

            setMenuPosition({
                top: rect.bottom + 6,
                left: rect.right - 220,
            });

            const data = await matterService.getAvailableMatters(selectedConversation.conversation.id);
            
            setAvailableMatters(data);
        }

        load();

    }, [selectedConversation]);
    

    useEffect(() => {

        function handleClick(e) {

            if (
                menuRef.current &&
                !menuRef.current.contains(e.target)
            ) {
                onClose();
                setShowSubmenu(false);
            }

        }

        document.addEventListener("mousedown", handleClick);

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClick
            );

    }, []);

    return createPortal(

        <AnimatePresence>

            {selectedConversation && (

                <motion.div
                    ref={menuRef}
                    initial={{
                        opacity: 0,
                        scale: .96,
                        y: -5
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0
                    }}
                    exit={{
                        opacity: 0,
                        scale: .96,
                        y: -5
                    }}
                    className="fixed z-[9999] w-56 rounded-xl border bg-white shadow-xl"
                    style={menuPosition}
                >

                   <button className="w-full px-4 py-3 text-left  rounded-xl hover:bg-slate-50">
                        Rename
                    </button>

                    <button className="w-full px-4 py-3 text-left rounded-xl hover:bg-slate-50">
                        Delete
                    </button>

                    <div className="border-t border-slate-100"/>


                    {/* Hover submenu */}
                    <div
                        className="relative"
                        onMouseEnter={() => setShowSubmenu(true)}
                        onMouseLeave={() => setShowSubmenu(false)}
                    >

                        <button className="flex w-full items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50">
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

                                    {availableMatters?.map(matter => (

                                        <button
                                            key={matter.id}
                                            className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left rounded-xl hover:bg-slate-50"
                                        >

                                            <div>

                                                <p className="text-sm font-medium">
                                                    {matter.title}
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    Matter
                                                </p>

                                            </div>

                                            {/* {conversation.matter?.id === matter.id && (
                                                <span className="text-green-600">
                                                    ✓
                                                </span>
                                            )} */}

                                        </button>

                                    ))}

                                </motion.div>

                            )}

                        </AnimatePresence>

                    </div>


                </motion.div>

            )}

        </AnimatePresence>,

        document.body

    );
}