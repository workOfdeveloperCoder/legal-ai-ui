import { Mic, ArrowUp, Paperclip } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatService } from "../../services/chatService";

export default function StartChatBanner() {

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function send() {
        if (!input.trim() || loading) return;

        setLoading(true);

        try {
            // create new conversation
            const conversation = await chatService.createConversation();

            // send first message
            await chatService.sendMessage(
                conversation.id,
                input.trim()
            );

            // setInput("");

            // redirect to chat page
            navigate(`/conversation/${conversation.id}`);

        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (

        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-[#23232F] p-8 text-white shadow-lg"
        >

            <div className="flex items-center justify-between">

            <textarea
                rows={1}
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Pakistani law..."
                className="max-h-52 min-h-[54px] w-full text-white resize-none border-0 bg-transparent px-3 py-2 text-[15px] leading-7 text-slate-800 outline-none placeholder:text-slate-400"
            />

            {/* Bottom Toolbar */}
            <div className="mt-3 flex items-center justify-between">

            {/* Left */}
            <div className="flex items-center gap-2">

                <button className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-slate-100">
                    <Paperclip size={18} />
                </button>

            </div>

            {/* Right */}
            <div className="flex items-center gap-2">

                <button className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-slate-100">
                    <Mic size={18} />
                </button>

                <button
                    type="button"
                    disabled={!input.trim()}
                    onClick={(e) => {
                        e.preventDefault();
                        send();
                    }}
                    className="flex h-11 w-11 items-center text-black justify-center rounded-2xl bg-[#ffc853] transition hover:scale-105 disabled:cursor-not-allowed"
                >
                    <ArrowUp size={18} />
                </button>

            </div>

            </div>

            </div>

        </motion.div>

    );

}