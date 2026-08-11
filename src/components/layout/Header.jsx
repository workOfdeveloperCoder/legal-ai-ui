import { Bell, Search, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { logout } from "../../services/auth";

export default function Header({ onMenuClick, user }) {
  const [imageError, setImageError] = useState(false);

  const initials = user?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-background/80 px-8 backdrop-blur-xl">
      <button
        onClick={onMenuClick}
        className="rounded-xl p-2 hover:bg-slate-100 min-[1000px]:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="relative w-[60%]">
        <Search
          size={20}
          className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search anything (cases, statutes, documents, or ask AI)"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-20 pl-12 shadow-sm outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <span className="absolute top-1/2 right-4 -translate-y-1/2 rounded-md border bg-slate-50 px-2 py-1 text-xs text-slate-500">
          ⌘ K
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-background transition hover:bg-slate-100">
          <Bell size={18} className="text-slate-500" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-yellow" />
        </button>

        <div className="flex items-center gap-3">
          {user?.avatar && !imageError ? (
            <img
              src={user?.avatar}
              alt={user?.name}
              className="h-10 w-10 rounded-full"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-semibold text-black">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => logout()}
            title="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-background transition hover:bg-slate-100"
          >
            <LogOut size={16} className="text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
