import { Bell, Search, Menu, User, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";

export default function Header({ onMenuClick, user }) {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await logout();
  }

  function handleProfile() {
    setOpen(false);
    navigate("/profile");
  }

  const initials = user?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 overflow-visible border-b border-slate-200 bg-background/80 px-8 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="shrink-0 rounded-xl p-2 hover:bg-slate-100 min-[1000px]:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="relative w-80 min-w-0 sm:w-96 lg:w-[45rem]">
          <Search
            size={20}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search anything (cases, statutes, documents, or ask AI)"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-20 pl-12 shadow-sm outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rounded-md border bg-slate-50 px-2 py-1 text-xs text-slate-500">
            ⌘ K
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-background transition hover:bg-slate-100"        >
          <Bell size={18} className="text-slate-500" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-yellow" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="cursor-pointer rounded-full p-0.5 transition hover:bg-slate-100"
          >
            {user?.avatar && !imageError ? (
              <img
                src={user.avatar}
                alt={user?.name}
                className="h-10 w-10 rounded-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-semibold text-black">
                {initials}
              </div>
            )}
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 z-[100] mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={handleProfile}
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                <User size={15} />
                Profile
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
