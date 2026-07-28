import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Dashboard from "../components/dashboard/Dashboard";
import Matters from "../components/matter/Matters";
import Matter from "../components/matter/Matter";
import MatterDetails from "../components/matter/MatterDetails";
import ChatArea from "../components/chat/ChatArea";

export default function AppRoutes({user}) {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                className="h-full min-h-0"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{
                    duration: 0.08,
                    ease: "easeOut",
                }}
            >
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />}/>

                    <Route path="/dashboard" element={<Dashboard user={user} />} />
                    <Route path="/matters" element={<Matters />} />
                    {/* <Route path="/matter/:matterId" element={<MatterDetails />} /> */}
                    <Route path="/conversation/:conversationId" element={<ChatArea />} />
                    <Route path="/matter/:matterId" element={<Matter />} />
                </Routes>
            </motion.div>
        </AnimatePresence>
    );
}