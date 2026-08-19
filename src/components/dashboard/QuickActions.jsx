import * as Icons from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActions({ data }) {
    const navigate = useNavigate();

    return (
<div className="grid ">
        <h2 className="text-lg py-2 font-semibold">
            Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-3">

            {(data || []).map(action => {

                const Icon = Icons[action.icon];

                return (

                    <button
                        key={action.id}
                        type="button"
                        onClick={() => action.href && navigate(action.href)}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                        <div className="flex items-start gap-4">

                            <div className="flex h-12 w-12 items-center max-[999px]:hidden justify-center rounded-xl bg-yellow-50 ">
                                <Icon
                                    size={32}
                                    className="text-yellow-500"
                                />
                            </div>

                            <div className="flex-1 text-left ml-2">
                                <p className="font-semibold text-slate-900">
                                    {action.title}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    {action.description}
                                </p>
                            </div>

                        </div>
                    </button>

                );

            })}

        </div>
        </div>

    );

}