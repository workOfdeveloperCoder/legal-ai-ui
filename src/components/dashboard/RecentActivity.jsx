import { FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function RecentActivity({ data }) {
    return (
    <div className="flex flex-col flex-1 min-[1500px]:min-h-0">

        <h2 className="text-lg py-2 font-semibold">
            Recent Activity
        </h2>
       <div className="flex-1 overflow-y-auto hide-scrollbar rounded-3xl border border-slate-200 bg-white shadow-[inset_0_10px_10px_-10px_rgba(0,0,0,0.15),inset_0_-10px_10px_-10px_rgba(0,0,0,0.15)]">

            {(data || []).length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">
                    No activity yet. Start a chat or create a matter.
                </p>
            ) : (
            (data || []).map(item => (
                <motion.div
                    key={item.id}
                    whileHover={{
                        x: 2,
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="relative flex items-center gap-4 border-b border-slate-200 p-2"
                >
                    <div className="rounded-xl bg-primary-soft p-3 max-[999px]:hidden">
                        <FileText size={32} strokeWidth={1.5} className="text-primary" />
                    </div>

                    <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted">{item.description}</p>
                    </div>

                    <span className="text-xs text-muted">
                        {item.time}
                    </span>
                </motion.div>

            ))
            )}

        </div>

    </div>
    );
}