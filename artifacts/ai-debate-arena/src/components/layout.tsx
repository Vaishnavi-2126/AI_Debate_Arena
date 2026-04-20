import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Brain, LayoutDashboard, Trophy, Home } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

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
          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link 
              href="/dashboard" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${location === '/dashboard' ? 'text-primary' : 'text-slate-400'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
