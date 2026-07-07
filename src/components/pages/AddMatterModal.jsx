import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import MatterForm from "./MatterForm";

export default function AddMatterModal({
    open,
    onClose,
    onCreated,
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
                        initial={{
                            opacity: 0,
                            scale: 0.98,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.98,
                            y: 12,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 700,
                            damping: 35,
                        }}
                    >
                        {/* Header */}

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                            <div>

                                <h2 className="text-xl font-semibold text-slate-900">
                                    New Matter
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Create a legal matter/project.
                                </p>

                            </div>

                            <motion.button
                                whileHover={{
                                    rotate: 90,
                                    scale: 1.08,
                                }}
                                whileTap={{
                                    scale: 0.9,
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={onClose}
                                className="rounded-lg p-2 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </motion.button>

                        </div>

                        {/* Form */}

                        <motion.div
                            className="p-6"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.12,
                                duration: 0.25,
                            }}
                        >
                            <MatterForm
                                onCreated={onCreated}
                                onClose={onClose}
                            />
                        </motion.div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}