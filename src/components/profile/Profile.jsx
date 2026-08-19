import { useEffect, useState } from "react";
import {
  AtSign,
  BadgeCheck,
  CircleDot,
  LogOut,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { fetchCurrentUser, logout } from "../../services/auth";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF6E5] text-amber-700">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function StatusRow({ ok, label, detail }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          ok ? "bg-emerald-500" : "bg-slate-300"
        }`}
      />
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export default function Profile({ user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const fresh = await fetchCurrentUser();
        if (!cancelled) setUser(fresh);
      } catch (err) {
        if (!cancelled) {
          setUser(initialUser);
          setError(err?.message || "Could not refresh profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  const initials = user?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-full bg-[#F7F8FC] px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase">
              Account
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your identity and workspace access for Legal AI.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-[#FFC853]" />
          <div className="flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:px-8">
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-[#FFF6E5]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFC853] text-3xl font-bold text-slate-900 ring-4 ring-[#FFF6E5]">
                  {initials || "?"}
                </div>
              )}
              {user?.isActive && (
                <span className="absolute right-1 bottom-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold text-slate-900">
                {user?.fullName || user?.name || "Account"}
              </h2>
              <p className="mt-1 flex items-center gap-2 truncate text-sm text-slate-500">
                <Mail size={14} className="shrink-0" />
                {user?.email || "No email on file"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {user?.role && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                    <Shield size={12} />
                    {user.role}
                  </span>
                )}
                {user?.isVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck size={12} />
                    Verified
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    user?.isActive
                      ? "border border-amber-200 bg-[#FFF6E5] text-amber-800"
                      : "border border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <CircleDot size={12} />
                  {user?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm lg:col-span-2">
            <h3 className="text-base font-semibold text-slate-900">
              Account details
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Information from your Legal AI login.
            </p>
            <div className="mt-2">
              <InfoRow
                icon={User}
                label="Full name"
                value={user?.fullName || user?.name}
              />
              <InfoRow icon={AtSign} label="Username" value={user?.username} />
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow
                icon={Shield}
                label="Role"
                value={user?.role ? user.role : null}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Account status
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Access for this workspace.
            </p>
            <div className="mt-4 divide-y divide-slate-100">
              <StatusRow
                ok={Boolean(user?.isActive)}
                label={user?.isActive ? "Account active" : "Account inactive"}
                detail={
                  user?.isActive
                    ? "You can use chat, matters, and documents."
                    : "This account is currently disabled."
                }
              />
              <StatusRow
                ok={Boolean(user?.isVerified)}
                label={user?.isVerified ? "Email verified" : "Email not verified"}
                detail={
                  user?.isVerified
                    ? "Your email has been confirmed."
                    : "Verification is pending."
                }
              />
              <StatusRow
                ok={Boolean(user?.role)}
                label={user?.role ? `${user.role} access` : "No role assigned"}
                detail="Role is assigned by your administrator."
              />
            </div>
          </div>
        </div>

        {loading && (
          <p className="sr-only" aria-live="polite">
            Refreshing profile
          </p>
        )}
      </div>
    </div>
  );
}