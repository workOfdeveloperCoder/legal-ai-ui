import { useState } from "react";
import { matterService } from "../../services/matterService";

export default function MatterForm({
    onClose,
    onCreated,
}) {

    const [title, setTitle] = useState("");
    const [model, setModel] = useState("gpt-5");
    const [nextHearing, setNextHearing] = useState("");

    async function handleSubmit(e) {

        e.preventDefault();

        const id = Date.now().toString();

        // Create Matter
        await matterService.createMatter(
            title,
            model,
            nextHearing
        );

        onCreated();
        onClose();

    }

    return (

        <form
            onSubmit={handleSubmit}
            className="space-y-5"
        >

            <div>

                <label className="mb-2 block text-sm font-medium">
                    Matter Title
                </label>

                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter matter title"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-yellow-500"
                />

            </div>

            <div>

                <label className="mb-2 block text-sm font-medium">
                    AI Model
                </label>

                <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                    <option>gpt-5</option>
                    <option>gpt-4.1</option>
                </select>

            </div>

            <div>

                <label className="mb-2 block text-sm font-medium">
                    Next Hearing
                </label>

                <input
                    type="date"
                    value={nextHearing}
                    onChange={(e) => setNextHearing(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />

            </div>

            <div className="flex justify-end gap-3">

                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border px-5 py-2"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="rounded-xl bg-yellow-500 px-5 py-2 text-white hover:bg-yellow-600"
                >
                    Create Matter
                </button>

            </div>

        </form>

    );

}