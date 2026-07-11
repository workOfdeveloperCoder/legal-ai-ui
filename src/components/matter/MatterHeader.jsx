import {
    ChevronRight,
    Upload,
    Plus,
    FileText,
    MessageSquare,
    CheckSquare,
    Star
} from "lucide-react";

export default function MatterHeader() {
    return (
        <div className="border-b border-[#ECECEC] bg-white px-8 py-5">

            {/* Breadcrumb */}

            <div className="mb-4 flex items-center gap-2 text-[13px] text-[#8B8B96]">

                <span>Home</span>

                <ChevronRight size={14} />

                <span>Matters</span>

                <ChevronRight size={14} />

                <span>Smith v. ABC Industries</span>

                <ChevronRight size={14} />

                <span className="font-medium text-[#444]">
                    Initial Research
                </span>

            </div>

            <div className="flex items-start justify-between">

                {/* Left */}

                <div>

                    <div className="flex items-center gap-2">

                        <h1 className="text-[30px] font-semibold text-[#202124]">
                            Smith v. ABC Industries
                        </h1>

                        <Star
                            size={18}
                            className="fill-[#F6B73C] text-[#F6B73C]"
                        />

                    </div>

                    <div className="mt-2 flex items-center gap-4 text-[14px] text-[#6C7280]">

                        <span>Contract Dispute</span>

                        <span>•</span>

                        <span>High Court</span>

                        <span>•</span>

                        <span>Case No. HC/2024/12345</span>

                    </div>

                </div>

                {/* Right */}

                <div className="flex items-center gap-4">

                    {/* Stats */}

                    <div className="flex gap-3">

                        <Stat
                            icon={<FileText size={15} />}
                            value="48 Documents"
                        />

                        <Stat
                            icon={<MessageSquare size={15} />}
                            value="12 Chats"
                        />

                        <Stat
                            icon={<CheckSquare size={15} />}
                            value="8 Tasks"
                        />

                    </div>

                    {/* Hearing */}

                    <div className="rounded-xl border border-[#ECECEC] bg-white px-5 py-3">

                        <div className="text-[11px] uppercase tracking-wide text-[#8C8C96]">
                            Next Hearing
                        </div>

                        <div className="mt-1 text-[18px] font-semibold">
                            15 May 2024
                        </div>

                    </div>

                    <button className="flex h-11 items-center gap-2 rounded-xl border border-[#E4E4E7] px-5 text-sm font-medium hover:bg-gray-50">
                        <Upload size={16} />
                        Upload
                    </button>

                    <button className="flex h-11 items-center gap-2 rounded-xl bg-[#F6B73C] px-5 text-sm font-semibold text-black hover:brightness-95">
                        <Plus size={16} />
                        New Chat
                    </button>

                </div>

            </div>

        </div>
    );
}

function Stat({ icon, value }) {
    return (
        <div className="flex h-11 items-center gap-2 rounded-xl border border-[#ECECEC] bg-white px-4">

            <div className="text-[#777]">
                {icon}
            </div>

            <span className="text-sm font-medium">
                {value}
            </span>

        </div>
    );
}