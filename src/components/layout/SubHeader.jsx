export default function SubHeader({

    title = "New Conversation",

    description = "AI-powered legal research & drafting",

    action = null,

    hideHeader = false

}) {

    return (
        
    <div className={`flex items-center justify-between bg-white px-8 py-6 ${hideHeader && "hidden" }`}>
        <div className="sticky top-0 z-20 bg-white backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-slate-900">
                {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
                {description}
            </p>
        </div>
        {action && (
            <div>
                {action}
            </div>
        )}
    </div>


    );

}