export default function DateBadge({ date }) {

    const parsedDate = new Date(date);

    const month = parsedDate
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase();

    const day = String(parsedDate.getDate()).padStart(2, "0");

    return (
        <div  className="max-[999px]:hidden flex h-12 w-12 flex-col overflow-hidden rounded-lg border border-slate-200 shadow-sm">
            <div className="bg-amber-50 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                {month}
            </div>

            <div className="flex flex-1 items-center justify-center bg-white text-lg font-semibold text-slate-900">
                {day}
            </div>
        </div>
    );
}