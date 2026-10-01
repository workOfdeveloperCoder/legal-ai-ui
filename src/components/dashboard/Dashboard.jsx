import { useEffect, useState } from "react";

import { dashboardService } from "../../services/dashboardService";

import WelcomeCard from "./WelcomeCard";
import RecentActivity from "./RecentActivity";
import CalendarCard from "./CalendarCard";
import TasksCard from "./TasksCard";
import QuickActions from "./QuickActions";
import StartChatBanner from "./StartChatBanner";
import MyMattersCard from "./MyMattersCard";

const EMPTY_DASHBOARD = {
  welcome: null,
  startChat: null,
  quickActions: [],
  recentActivity: [],
  matters: [],
  calendar: [],
  tasks: [],
};

export default function Dashboard({ user }) {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const data = await dashboardService.getDashboard();
      if (!cancelled) {
        setDashboard(data || EMPTY_DASHBOARD);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col min-[1280px]:h-full min-[1280px]:min-h-0">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col p-5 sm:p-7 min-[1280px]:h-full min-[1280px]:min-h-0">
        <div className="grid grid-cols-1 gap-5 min-[1280px]:grid-cols-12 min-[1280px]:min-h-0 min-[1280px]:flex-1 min-[1280px]:overflow-hidden">
          <div className="flex min-h-0 flex-col gap-5 overflow-hidden min-[1280px]:col-span-8">
            <WelcomeCard data={dashboard?.welcome} user={user} />

            <StartChatBanner data={dashboard?.startChat} />

            <QuickActions data={dashboard?.quickActions} />

            <RecentActivity data={dashboard?.recentActivity} />
          </div>

          <div className="min-h-0 min-[1280px]:col-span-4">
            <div className="flex flex-col gap-5 min-[1280px]:h-full">
              <div className="min-[1280px]:h-1/3 min-[1280px]:min-h-0">
                <MyMattersCard matters={dashboard?.matters || []} />
              </div>

              <div className="min-[1280px]:h-1/3 min-[1280px]:min-h-0">
                <CalendarCard data={dashboard?.calendar} />
              </div>

              <div className="min-[1280px]:h-1/3 min-[1280px]:min-h-0">
                <TasksCard data={dashboard?.tasks} />
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <p className="mt-2 text-center text-xs text-slate-400">
            Loading dashboard…
          </p>
        )}
      </div>
    </div>
  );
}
