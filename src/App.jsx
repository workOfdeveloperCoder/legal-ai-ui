import { useEffect, useState } from "react";
import {
  getCurrentUser,
  isAuthenticated,
  subscribeAuth,
} from "./services/auth";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import LoginPage from "./components/auth/LoginPage";
import AppRoutes from "./routes/AppRoutes";

import {
  chatService,
  resetConversationSyncState,
} from "./services/chatService";
import { subscribeConversations } from "./lib/conversationStore";

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [user, setUser] = useState(getCurrentUser());
  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function syncSidebarFromCache() {
    setConversations(chatService.getLocalConversations());
  }

  async function loadSidebarFromServer() {
    try {
      const data = await chatService.getConversations({ refresh: true });
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      syncSidebarFromCache();
    }
  }

  useEffect(() => {
    const unsubAuth = subscribeAuth(() => {
      const nextAuthed = isAuthenticated();
      setAuthed(nextAuthed);
      setUser(getCurrentUser());
      if (!nextAuthed) {
        resetConversationSyncState();
        setConversations([]);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!authed) return undefined;

    let cancelled = false;

    // One server fetch on login / session start.
    queueMicrotask(() => {
      if (!cancelled) loadSidebarFromServer();
    });

    // Later updates come from local cache only (no API loop).
    const unsub = subscribeConversations(() => {
      syncSidebarFromCache();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [authed]);

  if (!authed) {
    return (
      <LoginPage
        onAuthenticated={() => {
          setAuthed(true);
          setUser(getCurrentUser());
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        conversations={conversations}
        onSelect={() => {}}
        onConversationsChange={syncSidebarFromCache}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="min-w-0 flex-1 overflow-y-auto min-[1500px]:overflow-hidden min-[1500px]:min-h-0">
          <AppRoutes user={user} />
        </div>
      </main>
    </div>
  );
}
