import { Sparkles, ChevronDown, Bell, Search, Menu } from "lucide-react";
import { useState } from "react";


export default function Header({ onMenuClick, user }) {

  const {imageError, setImageError} = useState(false);
  
    
  const initials = user?.name?.split(" ").map(word => word[0]).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-background/80 px-8 backdrop-blur-xl">

    <button
        onClick={onMenuClick}
        className="min-[1000px]:hidden rounded-xl p-2 hover:bg-slate-100"
    >
        <Menu size={22} />
    </button>

      {/* Left */}

      <div className="relative w-[60%]">
      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/> 
          <input type="text" placeholder="Search anything (cases, statutes, documents, or ask AI)" 
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-20 shadow-sm outline-none focus:ring-2 focus:ring-yellow-400"/>         
          <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md border bg-slate-50 px-2 py-1 text-xs text-slate-500">
            ⌘ K
          </span>
        </div>


      {/* Right */}
      <div className="flex items-center gap-3">

        {/* <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-background transition hover:bg-slate-100">
          <Search size={18} className="text-slate-500" />
        </button> */}

        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-background transition hover:bg-slate-100">
          <Bell size={18} className="text-slate-500" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow" />
        </button>

        <button className="flex items-center gap-3">
          {/* User Avatar */}

           {user?.avatar && !imageError?(
                   <img src={user?.avatar}
                   alt={user?.name}
                   className="h-10 w-10 rounded-full"
                   onError={() => setImageError(true)}
                   />
           ):(
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-semibold text-black">
            {initials}
          </div>
           )}

          </button>
        {/* <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-background px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100">
          GPT-5
          <ChevronDown size={16} />
        </button> */}

      </div>

    </header>
  );
}