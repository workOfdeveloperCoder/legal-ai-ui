import { Folder } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function MyMatters({ matters }) {
    const navigate = useNavigate();

    return (
        <div className="h-full min-h-0 flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">


                <h2 className="text-lg font-semibold text-slate-900">
                    My Matters
                </h2>


                <button
                    type="button"
                    onClick={() => navigate("/matters")}
                    className="rounded-xl text-yellow-500 text-sm p-3"
                >
                   View All Matters
                </button>

            </div>

            {/* Scrollable Matters List */}
            <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">

                {(matters || []).length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">
                        No matters yet
                    </p>
                ) : (
                    (matters || []).map((matter) => (
                        <motion.div
                            key={matter.id}
                            whileHover={{
                                x: 2,
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="relative flex w-full cursor-pointer items-center py-2"
                            onClick={() => navigate(`/matter/${matter.id}`)}
                        >
                            <Folder
                                size={22}
                                fill="currentColor"
                                className="text-yellow-600 max-[999px]:hidden"
                            />

                            <div className="flex-1 pl-3">
                                <h3 className="font-medium text-slate-900">
                                    {matter.title}
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    {matter.lastMessage}
                                </p>
                            </div>

                            <div className="text-right text-slate-500">
                                {matter.nextHearing
                                    ? `Next: ${new Date(
                                          matter.nextHearing
                                      ).toLocaleDateString("en-GB", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                      })}`
                                    : ""}
                            </div>

                            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                        </motion.div>
                    ))
                )}

            </div>

        </div>
    );
}