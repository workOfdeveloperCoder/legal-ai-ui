import { Sparkle } from "lucide-react";

export default function WelcomeCard({ data }) {

    function getGreeting() {
        const hour = new Date().getHours();

        if (hour < 12) {
            return "Good Morning";
        }

        if (hour < 17) {
            return "Good Afternoon";
        }

        if (hour < 21) {
            return "Good Evening";
        }

        return "Good Night";
    }

    return (

        <div className="rounded-3xl px-4">

            <div className="flex">

                <div>

                    <h1 className="mt-2 text-4xl flex font-bold ">
                        {getGreeting() }, Yasir
                         <Sparkle size={40}  
                            fill="currentColor"
                            className="ml-3 text-yellow-500"
                            stroke="white"
                            strokeWidth={1}
                        />
                    </h1>

                    <p className="mt-3 max-w-xl text-slate-700">
                        How can I help you with your legal work today?
                       
                    </p>

                </div>

            </div>

        </div>

    );

}