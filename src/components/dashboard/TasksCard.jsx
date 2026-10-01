import { Circle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { workspaceService } from "../../services/workspaceService";

const priorityColors = {
    High: "bg-red-50 text-red-500",
    Medium: "bg-amber-50 text-amber-600",
    Low: "bg-blue-50 text-blue-500",
};

export default function TasksCard({ data }) {
    const [completed, setCompleted] = useState([]);

    const toggleTask = async (task) => {
        const next = task.status !== "done";
        try {
            await workspaceService.updateWorkItem(task.id, { status: next ? "done" : "open" });
            setCompleted((prev) => next ? [...new Set([...prev, task.id])] : prev.filter((id) => id !== task.id));
        } catch (error) { console.error("Could not update task", error); }
    };


    return (
      <div className="dashboard-panel tasks-panel h-full min-h-0 flex flex-col rounded-3xl border p-6 shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">


                <h2 className="text-lg font-semibold text-slate-900">
                    Tasks
                </h2>


                    <a href="/matters" className="rounded-xl p-3 text-sm text-[#007AFF] hover:bg-[#EAF3FF]">View matters</a>

            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar">
                {(data || []).length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">
                        No tasks yet
                    </p>
                ) : (
                    (data || []).map((task) => {
                        const isCompleted = task.status === "done" || completed.includes(task.id);

                        return (
                            <motion.div
                                key={task.id}
                                whileHover={{
                                    x: 2,
                                }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="relative flex items-center gap-4 py-3"
                            >
                                <button
                                    onClick={() => toggleTask(task)}
                                    aria-label={`${isCompleted ? "Reopen" : "Complete"} ${task.title}`}
                                    className="transition-colors"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center">
                                        <AnimatePresence mode="wait" initial={false}>
                                            {isCompleted ? (
                                                <motion.div
                                                    key="checked"
                                                    initial={{ scale: 0, rotate: -90 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    exit={{ scale: 0, rotate: 90 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 900,
                                                        damping: 25,
                                                    }}
                                                >
                                                    <CheckCircle2
                                                        size={30}
                                                        fill="#007AFF"
                                                        className="text-white"
                                                    />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="unchecked"
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.8, opacity: 0 }}
                                                    transition={{ duration: 0.10 }}
                                                >
                                                    <Circle
                                                        size={25}
                                                        className="text-slate-500"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </button>

                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-900">
                                        {task.title}
                                    </h4>

                                    <p className="text-sm text-slate-500">
                                        {task.matter}
                                    </p>
                                </div>

                                <span
                                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                                        priorityColors[task.priority] ||
                                        "bg-slate-50 text-slate-500"
                                    }`}
                                >
                                    {task.priority}
                                </span>

                                <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
