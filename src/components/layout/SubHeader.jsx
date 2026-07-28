import { div } from "framer-motion/client";
import { Children } from "react";

export default function SubHeader({

    title = "New Conversation",

    description = "AI-powered legal research & drafting",

    action = null,

    hideHeader = false,

    children = null,

}) {

    if (hideHeader) return null;

    return (

        <div className="sticky top-0 z-20 bg white background-clip-padding backdrop-blur-xl">
            {/* Breadcrumb / custom content */}
            {children &&(
                <div calssName= "mb-4">
                    {children}
                </div>
            )}
        
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
</div>

    );

}