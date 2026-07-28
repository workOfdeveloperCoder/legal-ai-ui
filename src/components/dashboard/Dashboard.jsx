import { useEffect, useState } from "react";

import { dashboardService } from "../../services/dashboardService";

import WelcomeCard from "./WelcomeCard";
import RecentActivity from "./RecentActivity";
import CalendarCard from "./CalendarCard";
import TasksCard from "./TasksCard";
import QuickActions from "./QuickActions";
import StartChatBanner from "./StartChatBanner";
import MyMattersCard from "./MyMattersCard";

export default function Dashboard( { user }) {
    const [dashboard, setDashboard] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        const data = await dashboardService.getDashboard();
        setDashboard(data);
    }

    if (!dashboard) return null;

    return (
        <div className="flex flex-col bg-[#F7F8FC] min-[1500px]:h-full min-[1500px]:min-h-0">
            <div className="flex flex-col p-6 min-[1500px]:h-full min-[1500px]:min-h-0">
                <div className="grid grid-cols-1 gap-6 min-[1500px]:grid-cols-12 min-[1500px]:flex-1 min-[1500px]:min-h-0 min-[1500px]:overflow-hidden">

                    {/* Left */}
                    <div className="min-[1500px]:col-span-8 flex flex-col min-h-0 overflow-hidden gap-6">
                        <WelcomeCard data={dashboard?.welcome} user={user}/>

                        <StartChatBanner data={dashboard?.startChat} />

                        <QuickActions data={dashboard?.quickActions} />

                        <RecentActivity data={dashboard?.recentActivity} />
                    </div>

                    {/* Right */}
                   <div className="min-h-0 min-[1500px]:col-span-4">
                        <div className="flex flex-col gap-6 min-[1500px]:h-full">
                            <div className="min-[1500px]:h-1/3 min-[1500px]:min-h-0">
                                <MyMattersCard matters={dashboard?.matters || []} />
                            </div>

                            <div className="min-[1500px]:h-1/3 min-[1500px]:min-h-0">
                                <CalendarCard data={dashboard?.calendar} />
                            </div>

                            <div className="min-[1500px]:h-1/3 min-[1500px]:min-h-0">
                                <TasksCard data={dashboard?.tasks} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}