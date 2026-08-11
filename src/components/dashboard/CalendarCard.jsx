import DateBadge from "../badges/DateBadge";
import { motion } from "framer-motion";

export default function CalendarCard({ data }) {

    return (

        <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between shrink-0">

                 <h2 className="text-lg font-semibold text-slate-900">
                    Calender
                </h2>


                <div className="rounded-xl text-yellow-500 text-sm p-3">
                   View all Calender
                </div>

            </div>

            <div className="mt-6 overflow-y-auto space-y-4 hide-scrollbar">

                {(data || []).length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">
                        No upcoming calendar events
                    </p>
                ) : (
                    (data || []).map((event) => (
                        <motion.div
                            key={event.id}
                            whileHover={{
                                x: 2,
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-4"
                        >
                            <DateBadge date={event.date} />

                            <div className="flex-1">
                                <h3 className="font-medium">
                                    {event.title}
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    {(event.type || "").charAt(0).toUpperCase() +
                                        (event.type || "").slice(1)}{" "}
                                    • {event.matter}
                                </p>
                            </div>

                            <div className="flex-1 text-right text-slate-500">
                                {event.time}
                            </div>
                        </motion.div>
                    ))
                )}

            </div>

        </div>

    );

}