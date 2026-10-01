import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import AddMatterModal from "./AddMatterModal";

import { Plus } from "lucide-react";

import MatterCard from "./MatterCard";

import { matterService } from "../../services/matterService";
import SubHeader from "../layout/SubHeader";

export default function Matters() {

    const [matters, setMatters] = useState([]);

    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {

        loadMatters();

    }, []);

    async function loadMatters() {

        setLoading(true);
        setError("");

        try {
            const data = await matterService.getMatters();
            setMatters(data);
        } catch (err) {
            console.error("Failed to load matters:", err);
            setMatters([]);
            setError(err?.message || "Failed to load matters.");
        } finally {
            setLoading(false);
        }

    }

    return (

        <div className="matter-page-glass flex h-full flex-col">

            {/* Header */}
            <SubHeader title="Matters" description=" Organize legal conversations into matters." 
            
                action={
                    <motion.button
                        whileHover={{
                            scale: 1.03,
                            y: -1,
                        }}
                        whileTap={{
                            scale: 0.96,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 25,
                        }}
                        onClick={() => setShowAddModal(true)}
                        className="primary-action flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium"
                    >
                        <Plus size={18} />
                        New Matter
                    </motion.button>
                }
            />

            {/* Cards */}

            <div className="flex-1 overflow-y-auto">

                <div className="mx-auto block min-[1300px]:grid max-w-7xl grid-cols-3 gap-6 p-8">

                    {error && (
                        <div className="col-span-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    {notice && <p className="col-span-full rounded-xl border border-blue-200/70 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">{notice}</p>}

                    {loading &&
                        [...Array(6)].map((_, i) => (

                            <div
                                key={i}
                                className="h-56 animate-pulse rounded-3xl bg-slate-200"
                            />

                        ))}

                    {!loading && !error && matters.length === 0 && (
                        <p className="col-span-full text-sm text-slate-500">
                            No matters yet. Create one to get started.
                        </p>
                    )}

                    {!loading &&
                        matters.map((matter,index) => (
                        <motion.div
                                key={matter.id}
                                layout
                                initial={{
                                    opacity: 0,
                                    y: 30,
                                    scale: .96
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1
                                }}
                                transition={{
                                    delay: index * .02,
                                    duration: .3
                                }}
                                className="max-[1300px]:pb-5"
                            >
                                <MatterCard matter={matter} onMatterChanged={loadMatters} />
                            </motion.div>
                        ))}

                </div>

            </div>


            <AddMatterModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={(created) => {
                    setNotice(created?.warning || "");
                    loadMatters();
                    setShowAddModal(false);
                }}
            />

        </div>

    );

}
