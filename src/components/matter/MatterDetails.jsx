import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { matterService } from "../../services/matterService";

import MatterConversationCard from "./MatterConversationCard";
import SubHeader from "../layout/SubHeader";

export default function MatterDetails({ }) {

    const [matter, setMatter] = useState(null);

    const { matterId } = useParams()

    useEffect(() => {
 
        loadMatter();

    }, [matterId]);

    async function loadMatter() {
        
        const data = await matterService.getMatter(matterId);
        
        setMatter(data);

    }

    return (
      
        <div className="bg-background min-h-screen">

            <SubHeader title={matter?.title} description="Linked legal conversations"/>

            <div className="mx-auto max-w-7xl p-8">

                <div className="space-y-5">

                    {matter?.conversations?.map((conversation,index) => (
                        <div key={conversation.id}>
                            <MatterConversationCard conversation={conversation} />
                            
                        </div>
                    ))}

                </div>

            </div>

        </div>

 
   );

}