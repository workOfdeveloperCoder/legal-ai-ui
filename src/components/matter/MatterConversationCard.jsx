import { MessageSquareText, ArrowRight, Clock3, Scale, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MatterConversationCard({
    conversation,
    setActivePage,
}) {

    const navigate = useNavigate()

    return (

        <div
            onClick={() => {navigate(`/conversation/${conversation.id}`);onClose?.();}}
            className="
                group
                rounded-xl
                border
                border-slate-200
                bg-white
                p-5
                transition-all
                duration-200
                hover:border-yellow-400
                hover:shadow-md
                cursor-pointer
            "
        >

            {/* Header */}

            <div className="flex items-start justify-between">

                <div className="flex gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">

                        <MessageSquareText
                            size={20}
                            className="text-yellow-600"
                        />

                    </div>

                    <div>

                        <h3 className="font-semibold text-slate-900">

                            {conversation.title}

                        </h3>

                        <p className="mt-1 text-sm text-slate-500">

                            {conversation.lastMessage}

                        </p>

                    </div>

                </div>

                <ArrowRight
                    size={18}
                    className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-yellow-600"
                />

            </div>

            {/* Tags */}

            <div className="mt-5 flex flex-wrap gap-2">

                <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">

                    <Scale size={12} />

                    GPT-5

                </span>

                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">

                    <FileText size={12} />

                    Legal Research

                </span>

            </div>

            {/* Footer */}

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                <div className="flex items-center gap-2 text-xs text-slate-500">

                    <Clock3 size={13} />

                    {conversation.updatedAt}

                </div>

                <button
                    className="
                        rounded-lg
                        border
                        border-yellow-300
                        px-3
                        py-1.5
                        text-xs
                        font-medium
                        text-yellow-700
                        transition
                        hover:bg-yellow-50
                    "
                >
                    Open Chat
                </button>

            </div>

        </div>

    );

}