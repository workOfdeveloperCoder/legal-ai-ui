import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import AddMatterModal from "./AddMatterModal";

import { Plus } from "lucide-react";

import MatterCard from "./MatterCard";

import { matterService } from "../../services/matterService";
import SubHeader from "../layout/SubHeader";

export default function Matters({setActivePage }) {

    const [matters, setMatters] = useState([]);

    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {

        loadMatters();

    }, []);

    async function loadMatters() {

        setLoading(true);

        const data = await matterService.getMatters();

        setMatters(data);

        setLoading(false);

    }

    return (

        <div className="flex h-full flex-col bg-background">

            {/* Header */}
            <SubHeader title="Matters" description=" Organize legal conversations into matters."/>

            {/* Cards */}

            <div className="flex-1 overflow-y-auto">

                <div className="mx-auto grid max-w-7xl grid-cols-3 gap-6 p-8">

                    {loading &&
                        [...Array(6)].map((_, i) => (

                            <div
                                key={i}
                                className="h-56 animate-pulse rounded-3xl bg-slate-200"
                            />

                        ))}

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
                            >
                                <MatterCard
                                    key={matter.id}
                                    matter={matter}
                                    setActivePage={setActivePage}
                                />
                            </motion.div>
                        ))}

                </div>

            </div>


            <AddMatterModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={() => {
                    loadMatters();
                    setShowAddModal(false);
                }}
            />

        </div>

    );

}