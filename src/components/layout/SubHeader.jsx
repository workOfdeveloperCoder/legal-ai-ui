export default function SubHeader({

    title = "New Conversation",

    description = "AI-powered legal research & drafting",

}) {

    return (

        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-8 py-5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-slate-900">
            {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
            {description}
            </p>
        </div>


    );

}