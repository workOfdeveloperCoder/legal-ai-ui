
import SubHeader from "../layout/SubHeader";
import ChatArea from "../chat/ChatArea";
import MatterSidebar from "./matterSidebar";
import MatterHeader from "./MatterHeader";

export default function Matter() {
    return (
        <div className="flex h-screen bg-[#F8F8FA]">

            {/* Center */}
            <div className="flex flex-1 flex-col">

                <MatterHeader />

                <div className="flex flex-1 overflow-hidden">

                    <div className="flex-1 overflow-hidden p-6">
                        <ChatArea hideHeader={true} />
                    </div>

                    <MatterSidebar />

                </div>

            </div>

        </div>
    );
}