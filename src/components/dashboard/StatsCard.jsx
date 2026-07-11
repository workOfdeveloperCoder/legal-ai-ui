import * as Icons from "lucide-react";

export default function StatsCard({

    title,
    value,
    icon

}) {

    const Icon = Icons[icon];

    return (

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">

            <div className="flex items-center justify-between">

                <div>

                    <p className="text-sm text-muted">
                        {title}
                    </p>

                    <h2 className="mt-2 text-3xl font-bold">
                        {value}
                    </h2>

                </div>

                <div className="rounded-2xl bg-primary-soft p-4">

                    <Icon
                        size={26}
                        className="text-primary"
                    />

                </div>

            </div>

        </div>

    );

}