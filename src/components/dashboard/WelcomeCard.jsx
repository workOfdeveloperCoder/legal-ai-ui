export default function WelcomeCard({ user }) {

    const firstName = user?.name?.split(" ")[0] ?? "Guest";

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

        <div className="px-1">

            <div className="flex">

                <div>

                    <h1 className="mt-2 flex text-[30px] font-semibold tracking-tight text-[#1D1D1F]">
                        {getGreeting()}, {firstName}
                    </h1>

                    <p className="mt-2 max-w-xl text-[14px] text-[#6E6E73]">
                        Research Pakistani law with answers grounded in cited authorities.
                       
                    </p>

                </div>

            </div>

        </div>

    );

}
