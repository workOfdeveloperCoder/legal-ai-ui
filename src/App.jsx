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

import { chatService } from "./services/chatService";
import { subscribeConversations } from "./lib/conversationStore";

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [user, setUser] = useState(getCurrentUser());
  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function loadSidebar() {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    }
  }

  useEffect(() => {
    const unsubAuth = subscribeAuth(() => {
      const nextAuthed = isAuthenticated();
      setAuthed(nextAuthed);
      setUser(getCurrentUser());
      if (!nextAuthed) {
        setConversations([]);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!authed) return undefined;

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) loadSidebar();
    });

    const unsub = subscribeConversations(() => {
      loadSidebar();
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
        onConversationsChange={loadSidebar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto min-[1500px]:overflow-hidden min-[1500px]:min-h-0">
          <AppRoutes user={user} />
        </div>
      </main>
    </div>
  );
}
