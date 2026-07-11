// components/matter/MatterSidebar.jsx

import { FileText, Pin, Pencil } from "lucide-react";

export default function MatterSidebar() {
    return (
        <aside className="w-[320px] border-l border-[#ECECEC] bg-white p-6">

            {/* Matter Info */}

            <div>

                <div className="mb-5 flex items-center justify-between">

                    <h3 className="text-[18px] font-semibold text-[#202124]">
                        Matter Info
                    </h3>

                    <button className="flex items-center gap-1 text-sm font-medium text-[#D39A1F] hover:underline">
                        <Pencil size={14} />
                        Edit
                    </button>

                </div>

                <div className="space-y-4">

                    <InfoRow label="Client" value="ABC Industries Ltd." />

                    <InfoRow label="Opposite Party" value="Smith" />

                    <InfoRow label="Court" value="High Court" />

                    <InfoRow
                        label="Case Number"
                        value="HC/2024/12345"
                    />

                    <InfoRow
                        label="Practice Area"
                        value="Contract Dispute"
                    />

                    <InfoRow label="Lawyer" value="John Doe" />

                    <InfoRow label="Status" value="Active" />

                    <InfoRow
                        label="Next Hearing"
                        value="15 May 2024"
                    />

                </div>

            </div>

            {/* Divider */}

            <div className="my-8 border-t border-[#ECECEC]" />

            {/* Pinned Notes */}

            <div>

                <div className="mb-4 flex items-center gap-2">

                    <Pin
                        size={16}
                        className="text-[#D39A1F]"
                    />

                    <h3 className="text-[18px] font-semibold">
                        Pinned Notes
                    </h3>

                </div>

                <div className="space-y-3">

                    <NoteCard
                        title="Client meeting notes"
                        date="12 May 2024"
                    />

                    <NoteCard
                        title="Key arguments"
                        date="08 May 2024"
                    />

                </div>

                <button className="mt-5 w-full text-sm font-medium text-[#D39A1F] hover:underline">
                    View all notes
                </button>

            </div>

        </aside>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-5">

            <span className="text-[13px] text-[#7B8190]">
                {label}
            </span>

            <span className="text-right text-[13px] font-medium text-[#202124]">
                {value}
            </span>

        </div>
    );
}

function NoteCard({ title, date }) {
    return (
        <div className="rounded-xl border border-[#ECECEC] bg-[#FCFAF6] p-4">

            <div className="flex gap-3">

                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3DA]">

                    <FileText
                        size={16}
                        className="text-[#D39A1F]"
                    />

                </div>

                <div>

                    <h4 className="text-sm font-semibold text-[#202124]">
                        {title}
                    </h4>

                    <p className="mt-1 text-xs text-[#7B8190]">
                        {date}
                    </p>

                </div>

            </div>

        </div>
    );
}