export default function EmptyState() {
    return (
        <div className="flex h-full flex-col items-center justify-center">

    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl">
        <Scale size={36} className="text-white"/>
    </div>

    <h1 className="mt-8 text-4xl font-bold">
        Pakistan Legal AI
    </h1>

    <p className="mt-3 max-w-xl text-center text-slate-500">
        Ask about Pakistani laws, draft petitions,
        summarize judgments, or upload legal documents.
    </p>

</div>
    )}