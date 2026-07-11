import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { chatService } from "../../services/chatService";

import ChatMessage from "./ChatMessage";
import EmptyState from "./EmptyState";
import PromptBar from "./PromptBar";
import SubHeader from "../layout/SubHeader";

export default function ChatArea({hideHeader = false}) {
    const [conversation, setConversation] = useState(null);

    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);

    const { conversationId } = useParams();


    useEffect(() => {
        if (!conversationId) return;

        loadConversation();
    }, [conversationId]);

    async function loadConversation() {
        const data = await chatService.getConversation(conversationId);

        setConversation(data);
    }

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [conversation?.messages]);


  return (
    <div className="flex h-full flex-col">

        {/* Header */}
        <SubHeader hideHeader={hideHeader} title={conversation?.title} description="AI-powered legal research & drafting"/>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
            {!conversation?.messages?.length ? (
                <></>
            ) : (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-8 py-8">

                {conversation?.messages.map((message) => (
                    <ChatMessage
                        key={message.id}
                        message={message}
                    />
                ))}
                {/* {loading && (
                <div className="flex items-center gap-3">

                    <div className="h-9 w-9 animate-pulse rounded-xl bg-yellow" />

                    <div className="space-y-2">

                    <div className="h-3 w-44 animate-pulse rounded bg-slate-300" />

                    <div className="h-3 w-64 animate-pulse rounded bg-slate-200" />

                    </div>

                </div>
                )} */}

            </div>
            )}

        </div>

            <div className="border-t bg-[#F7F8FC] border-slate-200 bg-background px-8 py-6">
                <PromptBar
                    conversation={conversation}
                    setConversation={setConversation}
                />
            </div>
        </div>
    );
}