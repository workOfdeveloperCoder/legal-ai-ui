import { useState } from "react";
import { Scale } from "lucide-react";
import { login, register } from "../../services/auth";

export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register({
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        });
      }
      onAuthenticated?.();
    } catch (err) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[20px] border border-slate-200/90 bg-white p-8 shadow-[0_18px_55px_rgba(0,0,0,.08)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EAF3FF] text-[#007AFF]">
            <Scale size={21} />
          </div>
          <div>
            <h1 className="text-[19px] font-semibold tracking-tight text-[#1D1D1F]">Juris</h1>
            <p className="text-[13px] text-[#6E6E73]">
              Pakistan legal workspace
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white/65 px-4 py-3 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white/65 px-4 py-3 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white/65 px-4 py-3 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white/65 px-4 py-3 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="primary-action w-full rounded-xl py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              Need an account?{" "}
              <button
                type="button"
                className="font-medium text-slate-900 underline"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already registered?{" "}
              <button
                type="button"
                className="font-medium text-slate-900 underline"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
