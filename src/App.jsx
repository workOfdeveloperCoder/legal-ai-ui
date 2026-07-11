import { useEffect, useState } from "react";
import { AnimatePresence, motion} from 'framer-motion';
import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import ChatArea from "./components/chat/ChatArea";
import Matters from "./components/matter/Matters";
import MatterDetail from "./components/matter/MatterDetails";
import Dashboard from "./components/dashboard/Dashboard";

import { chatService } from "./services/chatService";

import AppRoutes from './routes/AppRoutes'

export default function App() {

    const navigate = useNavigate();

    const location = useLocation();

    const [activePage, setActivePage] = useState("dashboard");

    const [conversations, setConversations] = useState([]);

    const [selectedConversationId, setSelectedConversationId] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        loadSidebar();
    }, []);

    async function loadSidebar() {

        const data = await chatService.getConversations();

        setConversations(data);

        if (data.length) {
            setConversations(data);
        }

    }

    return (

        <div className="flex h-screen w-screen overflow-hidden bg-background">

            <Sidebar
                conversations={conversations}
                onSelect={setSelectedConversationId}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="flex flex-1 flex-col overflow-hidden">


                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <div className="flex-1 overflow-y-auto min-[1500px]:overflow-hidden min-[1500px]:min-h-0">
                    <AppRoutes />
                </div>

            </main>

        </div>

    );

}