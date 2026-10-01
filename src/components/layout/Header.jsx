import { Bell, Menu, User, LogOut, ChevronRight, Search, X, FileText, Folder, MessageSquare, Scale } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { workspaceService } from "../../services/workspaceService";
import DocumentSourcePanel from "../chat/DocumentSourcePanel";

function pageName(pathname) {
  if (pathname === "/dashboard" || pathname === "/") return "Workspace";
  if (pathname === "/matters") return "Matters";
  if (pathname === "/profile") return "Profile";
  if (pathname.startsWith("/matter/")) return "Matter";
  if (pathname.startsWith("/conversation/")) return "Legal research";
  return "Workspace";
}

export default function Header({ onMenuClick, user }) {
  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [legalSource, setLegalSource] = useState(null);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setSearchOpen(true);
      }
      if (event.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      setSearchLoading(true);
      workspaceService.search(searchQuery.trim())
        .then((data) => { if (active) setSearchResults(data?.items || []); })
        .catch(() => { if (active) setSearchResults([]); })
        .finally(() => { if (active) setSearchLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [searchQuery]);

  function closeSearch() { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); }

  useEffect(() => {
    function dismissOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", dismissOutside);
    return () => document.removeEventListener("mousedown", dismissOutside);
  }, []);

  async function toggleNotifications() {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (!next) return;
    try {
      const data = await workspaceService.notifications();
      setNotifications(data?.items || []);
      setNotificationError("");
    } catch {
      setNotifications([]);
      setNotificationError("Recent activity is unavailable right now.");
    }
  }

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
  }

  const initials = user?.name?.split(" ").map((word) => word[0]).join("").toUpperCase() || "U";

  return (
    <header className="app-toolbar">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} aria-label="Open navigation" className="toolbar-icon min-[1000px]:hidden">
          <Menu size={19} />
        </button>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-slate-400 sm:inline">Juris</span>
          <ChevronRight size={14} className="hidden text-slate-300 sm:block" />
          <span className="truncate font-medium text-slate-800">{pageName(pathname)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2" ref={notificationRef}>
        <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search workspace" className="toolbar-icon"><Search size={18} /></button>
        <button type="button" onClick={toggleNotifications} aria-label="Recent activity" aria-expanded={notificationsOpen} className="toolbar-icon">
          <Bell size={18} />
        </button>
        {notificationsOpen && <section className="popover-panel activity-popover right-16 top-12 w-[min(360px,calc(100vw-2rem))]" aria-label="Recent activity">
          <header className="activity-popover-heading px-4 py-3 text-[13px] font-semibold text-slate-600"><span>Recent activity</span><span className="activity-heading-mark"><Bell size={14}/></span></header>
          {notificationError ? <p className="px-4 py-5 text-[12px] text-slate-500">{notificationError}</p> : notifications.length ? <div className="activity-popover-list">{notifications.map((item) => <article key={item.id} className="activity-popover-item px-4 py-3 text-[12px] text-slate-600"><p>{item.title}</p><time className="mt-1 block text-[10px] text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</time></article>)}</div> : <p className="px-4 py-5 text-[12px] text-slate-500">No recent activity.</p>}
        </section>}

        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Account menu" className="account-button">
            {user?.avatar && !imageError ? <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" onError={() => setImageError(true)} /> : <span>{initials}</span>}
          </button>
          {menuOpen && <div role="menu" className="popover-panel right-0 top-11 w-56 overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3"><p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div>
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate("/profile"); }} className="menu-item"><User size={16}/> Profile</button>
            <button type="button" role="menuitem" onClick={handleLogout} className="menu-item text-red-600"><LogOut size={16}/> Sign out</button>
          </div>}
        </div>
      </div>
      {searchOpen && createPortal(<div className="search-scrim fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[13vh]" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSearch(); }}>
        <section role="dialog" aria-modal="true" aria-label="Search Juris" className="w-full max-w-[640px] overflow-hidden rounded-[18px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(0,0,0,.2)]">
          <div className="flex items-center gap-3 border-b border-slate-200/75 px-4 py-3"><Search size={19} className="text-[#6E6E73]"/><input autoFocus value={searchQuery} onChange={(event) => { const value = event.target.value; setSearchQuery(value); if (value.trim().length < 2) { setSearchResults([]); setSearchLoading(false); } }} onKeyDown={(event) => { if (event.key === "Escape") closeSearch(); }} placeholder="Search matters, chats, documents, and legal authorities" aria-label="Search Juris" className="search-field min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-2 text-[15px] text-[#1D1D1F] outline-none placeholder:text-[#8E8E93]"/><button type="button" onClick={closeSearch} aria-label="Close search" className="toolbar-icon h-8 w-8"><X size={16}/></button></div>
          <div className="max-h-[55vh] overflow-y-auto p-2">
            {searchQuery.trim().length < 2 ? <p className="px-3 py-5 text-sm text-[#8E8E93]">Search your workspace and the indexed Pakistan law library.</p> : searchLoading ? <p className="px-3 py-5 text-sm text-[#6E6E73]">Searching…</p> : searchResults.length === 0 ? <p className="px-3 py-5 text-sm text-[#6E6E73]">No matching matters, records, or legal authorities.</p> : searchResults.map((item) => { const Icon = item.type === "matter" ? Folder : item.type === "document" ? FileText : item.type === "authority" ? Scale : MessageSquare; const actionable = Boolean(item.href) || item.type === "authority"; const ResultTag = actionable ? "button" : "div"; return <ResultTag key={`${item.type}-${item.id}`} onClick={actionable ? () => { if (item.type === "authority") { setLegalSource({ documentId: item.id, sourceType: "legal", title: item.title, filename: item.filename }); closeSearch(); } else { closeSearch(); navigate(item.href); } } : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${actionable ? "hover:bg-[#F5F5F7]" : "cursor-default"}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F5F5F7] text-[#007AFF]"><Icon size={16}/></span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-[#1D1D1F]">{item.title}</span>{item.citation && <span className="mt-0.5 block truncate text-xs text-[#6E6E73]">{item.citation}</span>}</span><span className="text-[10px] font-medium uppercase tracking-wide text-[#8E8E93]">{item.type === "authority" ? "Qdrant authority" : item.type}</span></ResultTag>; })}
          </div>
          <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-[11px] text-[#8E8E93]"><span>Searches your records and indexed legal sources</span><span>Esc to close</span></footer>
        </section>
      </div>, document.body)}
      {legalSource && createPortal(<DocumentSourcePanel source={legalSource} onClose={() => setLegalSource(null)} />, document.body)}
    </header>
  );
}
