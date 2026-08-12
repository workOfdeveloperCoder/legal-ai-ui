import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import MatterSidebar from "./MatterSidebar";
import MatterHeader from "./MatterHeader";
import MatterConversationCards from "./MatterConversationCards";
import { matterService } from "../../services/matterService";
import { chatService } from "../../services/chatService";
import { documentService } from "../../services/documentService";

export default function Matter() {
  const { matterId } = useParams();
  const navigate = useNavigate();
  const [matter, setMatter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadMatter() {
      if (!matterId) return;
      setLoading(true);
      setError("");

      try {
        const matterData = await matterService.getMatter(matterId);
        if (!cancelled) setMatter(matterData);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Failed to load matter.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMatter();
    return () => {
      cancelled = true;
    };
  }, [matterId]);

  const handleListLoaded = useCallback((conversations) => {
    setMatter((prev) =>
      prev ? { ...prev, conversations } : prev
    );
  }, []);

  async function handleNewChat() {
    if (!matter) return;
    const created = await chatService.createConversation({
      matter: {
        id: matter.id,
        title: matter.title,
      },
    });
    const realId = await chatService.ensureServerConversation(created.id, {
      title: `${matter.title} chat`,
      matter: {
        id: matter.id,
        title: matter.title,
      },
    });
    navigate(`/conversation/${realId}`);
  }

  async function loadDocuments(){
    if(!matterId) return;
    try{
      const docs = await documentService.getMatterDocuments(matterId);
      setDocuments(docs);
    setMatter((prev) => prev ? { ...prev, documents: docs } : prev);
    }
    catch(err){
      console.error(err);
      setDocuments([]);
    }
  }
   useEffect(() =>{
          loadDocuments();
   }, [matterId]);

   async function handleUploaded(uplaoded){
    await loadDocuments();
   }

  function handleSelectConversation(id) {
    navigate(`/conversation/${id}`);
  }

  return (
    <div className="flex h-full min-h-0 bg-[#F8F8FA]">
      <div className="flex min-h-0 flex-1 flex-col">
        <MatterHeader
          matter={matter}
          matterId={matterId}
          onNewChat={handleNewChat}
          onUploaded= {handleUploaded}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Loading matter…
              </div>
            ) : (
              <MatterConversationCards
                matterId={matterId}
                matterTitle={matter?.title}
                onSelectConversation={handleSelectConversation}
                onListLoaded={handleListLoaded}
              />
            )}
          </div>

          <MatterSidebar />
        </div>
      </div>
    </div>
  );
}
