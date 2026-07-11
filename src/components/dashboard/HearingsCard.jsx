import { Scale } from "lucide-react";

export default function HearingsCard({ data }) {

    return (

        <div className="rounded-3xl border bg-white p-6 shadow-card">

            <h2 className="text-lg font-semibold">

                Upcoming Hearings

            </h2>

            <div className="mt-6 space-y-4">

                {data.map(item => (

                    <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                    >

                        <div className="flex gap-4">

                            <div className="rounded-xl bg-primary-soft p-3">

                                <Scale
                                    className="text-primary"
                                />

                            </div>

                            <div>

                                <h4 className="font-medium">

                                    {item.matter}

                                </h4>

                                <p className="text-sm text-muted">

                                    {item.court}

                                </p>

                            </div>

                        </div>

                        <div className="text-right">

                            <p className="font-medium">

                                {item.date}

                            </p>

                            <p className="text-sm text-muted">

                                {item.time}

                            </p>

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );

}