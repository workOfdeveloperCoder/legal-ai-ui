import { useEffect, useState } from "react";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import ChatArea from "./components/chat/ChatArea";
import Matters from "./components/pages/Matters";
import MatterDetail from "./components/pages/MatterDetails";
import { AnimatePresence, motion} from 'framer-motion';

import { chatService } from "./services/chatService";

export default function App() {

    const [activePage, setActivePage] = useState("chat");

    const [conversations, setConversations] = useState([]);

    const [selectedConversationId, setSelectedConversationId] = useState(null);

    useEffect(() => {
        loadSidebar();
    }, []);

    async function loadSidebar() {

        const data = await chatService.getConversations();

        setConversations(data);

        if (data.length) {
            
            setConversations(data);

            setSelectedConversationId(data[0].id);

            setActivePage(`/conversation/${data[0].id}`);

        }

    }

    return (

        <div className="flex h-screen w-screen overflow-hidden bg-background">

            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelect={setSelectedConversationId}
            />

            <main className="flex flex-1 flex-col overflow-hidden">

                <Header />

                <div className="flex-1 overflow-hidden relative">

                    <AnimatePresence mode="wait">

                       <motion.div
                            key={activePage}
                            className="h-full"
                            initial={{
                                opacity: 0,
                                x: 12,
                            }}
                            animate={{
                                opacity: 1,
                                x: 0,
                            }}
                            exit={{
                                opacity: 0,
                                x: -12,
                            }}
                            transition={{
                                duration: 0.08,
                                ease: "easeOut",
                            }}
                        >

                            {activePage === "/matters" && (
                                <Matters
                                    setActivePage={setActivePage}
                                />
                            )}

                            {activePage.startsWith("/matter/") && (
                                <MatterDetail
                                    matterId={activePage.split("/").pop()}
                                    setActivePage={setActivePage}
                                />
                            )}

                            {activePage.startsWith("/conversation/") && (
                                <ChatArea
                                    conversationId={selectedConversationId}
                                />
                            )}

                        </motion.div>

                    </AnimatePresence>

                </div>

            </main>

        </div>

    );

}