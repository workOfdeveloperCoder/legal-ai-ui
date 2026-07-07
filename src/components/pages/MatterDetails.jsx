import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";

import { matterService } from "../../services/matterService";

import MatterConversationCard from "./MatterConversationCard";

export default function MatterDetails({ matterId, setActivePage }) {

  
    const [matter, setMatter] = useState(null);

    useEffect(() => {

        console.log('pkoijuhgvfcdxcfgvhjkl');
        
        loadMatter();

    }, [matterId]);

    async function loadMatter() {

        console.log(matterId);
        
        const data = await matterService.getMatter(matterId);
        
        setMatter(data);

    }

    return (
      
        <div className="bg-background min-h-screen">

            <div className="border-b border-border bg-white">

                <div className="mx-auto max-w-7xl px-8 py-8">

                    <Link
                        to="/matters"
                        className="cursor-pointer mb-5 inline-flex items-center gap-2 text-muted hover:text-heading"
                    >
                        <ArrowLeft size={18}/>
                        Matters
                    </Link>

                    <h1 className="text-4xl font-semibold text-heading">

                        {matter?.title}

                    </h1>

                    <p className="mt-2 text-muted">

                        Linked legal conversations

                    </p>

                </div>

            </div>

            <div className="mx-auto max-w-7xl p-8">

                <div className="space-y-5">

                   
                    {matter?.conversations?.map((conversation,index) => (
                        <div key={conversation.id}>
                            <MatterConversationCard
                                conversation={conversation}
                            />
                            
                        </div>
                    ))}

        

                </div>

            </div>

        </div>

 
   );

}