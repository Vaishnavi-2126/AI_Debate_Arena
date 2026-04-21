import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Brain, Sparkles, Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        if (!displayName.trim()) {
          setError("Display name is required");
          setLoading(false);
          return;
        }
        await register(username.trim(), displayName.trim(), password);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-indigo-600/10 to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">AI Debate Arena</span>
        </div>

        <div className="relative space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Real AI</span>
            </div>
            <h1 className="text-5xl font-black text-white leading-tight mb-4">
              Sharpen your<br />
              <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                mind in combat
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Debate an AI that challenges every claim, scores your logic in real time, and helps you become a stronger thinker.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Brain, label: "Logic", sub: "scored live" },
              { icon: Zap, label: "Streaks", sub: "daily rewards" },
              { icon: Sparkles, label: "XP & Levels", sub: "rank up" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="glass-panel p-4 rounded-2xl text-center">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm font-bold text-white">{label}</div>
                <div className="text-xs text-slate-500">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-600 text-sm">
          Your arguments. Your growth. Every session counts.
        </p>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">AI Debate Arena</span>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white mb-1">
              {mode === "login" ? "Welcome back" : "Join the arena"}
            </h2>
            <p className="text-slate-400">
              {mode === "login"
                ? "Sign in to continue your debates"
                : "Create your account to start debating"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex p-1 gap-1 bg-slate-900 rounded-xl border border-white/10">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === m
                    ? "bg-primary text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                autoComplete={mode === "login" ? "username" : "username"}
                className="h-12 bg-slate-900/80 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary/50"
                required
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How others see you"
                  autoComplete="name"
                  className="h-12 bg-slate-900/80 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary/50"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="h-12 bg-slate-900/80 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary/50 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-xs text-slate-600 mt-1">At least 6 characters</p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] transition-all hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.6)]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === "login" ? (
                "Enter Arena"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-slate-500 text-sm">
            {mode === "login" ? (
              <>Don't have an account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); }} className="text-primary hover:underline font-medium">Sign up free</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); }} className="text-primary hover:underline font-medium">Sign in</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
