import { Bot, User } from "lucide-react";

export default function ChatMessage({ message }) {
    const isUser = message.role === "user";

    return (
        <div
            className= {`flex mb-8 ${
                isUser ? "justify-end" : "justify-start"
            }`}
        >
            <div
                className={`flex items-start gap-4 max-w-4xl ${
                    isUser ? "flex-row-reverse" : ""
                }`}
            >
                {/* Avatar */}
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isUser
                            ? "bg-yellow text-white"
                            : "bg-gray-200 text-gray-700"
                    }`}
                >
                    {isUser ? <User size={18} /> : <Bot size={18} />}
                </div>

                {/* Message */}
                <div
                    className={`rounded-3xl px-5 shadow-sm ${
                        isUser
                            ? "bg-[#FFE2A3] text-gray-500"
                            : "bg-[#F7F8FC]"
                    }`}
                >
                    <p className="leading-7 mt-3 whitespace-pre-wrap">
                        {message.content}
                    </p>

                    {/* Sources */}
                    {message.sources && (
                        <div className="mt-5 border-t pt-4">
                            <p className="text-xs font-semibold uppercase text-gray-500 mb-3">
                                Sources
                            </p>

                            <div className="space-y-2">
                                {message.sources.map((source, index) => (
                                    <div
                                        key={index}
                                        className="rounded-xl bg-gray-100 px-4 py-3"
                                    >
                                        <div className="font-medium text-sm text-gray-800">
                                            {source.title}
                                        </div>

                                        {source.section && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Section {source.section}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Time */}
                    <div
                        className={`mt-3 text-xs ${
                            isUser
                                ? "text-violet-200"
                                : "text-gray-400"
                        }`}
                    >
                        {message.created_at}
                    </div>
                </div>
            </div>
        </div>
    );
}