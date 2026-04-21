import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Brain, LayoutDashboard, Home, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col relative z-10 text-slate-100">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/20 p-2 rounded-xl group-hover:bg-primary/30 transition-colors">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AI Debate Arena
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-slate-400"}`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${location === "/dashboard" ? "text-primary" : "text-slate-400"}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </nav>

            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">{user.displayName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-slate-500 hover:text-slate-200 hover:bg-white/5 gap-1.5 h-8 px-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Sign out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
