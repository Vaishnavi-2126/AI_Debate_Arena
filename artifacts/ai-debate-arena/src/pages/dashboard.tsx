import { useGetDashboard } from "@workspace/api-client-react";
import { Loader2, Trophy, Brain, Target, Shield, Zap, Swords, Medal } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboard) return null;

  const { profile, totalDebates, averageScore, bestTopic, recentDebates, topicBreakdown } = dashboard;
  const xpPercent = (profile.xp / (profile.xp + profile.xpToNextLevel)) * 100;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Top Section: Profile & Level */}
      <div className="glass-panel rounded-3xl p-8 border border-white/10 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />
        
        <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-primary shadow-[0_0_30px_rgba(124,58,237,0.3)] flex items-center justify-center shrink-0">
          <Brain className="w-16 h-16 text-primary" />
        </div>
        
        <div className="flex-1 w-full space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white mb-1">Level {profile.level}: {profile.levelName}</h1>
              <p className="text-slate-400 font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {profile.streak} Day Streak
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{profile.xp} <span className="text-sm text-slate-500">XP</span></div>
              <div className="text-sm text-slate-400">{profile.xpToNextLevel} XP to Next Level</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={xpPercent} className="h-3 bg-slate-800" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Stats & Breakdown */}
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-2xl text-center">
              <div className="text-4xl font-black text-white mb-1">{totalDebates}</div>
              <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Matches</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl text-center">
              <div className="text-4xl font-black text-emerald-400 mb-1">{averageScore.toFixed(1)}</div>
              <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Avg Score</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Topic Mastery
            </h3>
            <div className="space-y-4">
              {topicBreakdown.map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-medium truncate pr-4">{stat.topic}</span>
                    <span className="text-primary font-bold">{stat.avgScore.toFixed(1)}</span>
                  </div>
                  <Progress value={(stat.avgScore / 30) * 100} className="h-1.5 bg-slate-800" />
                </div>
              ))}
              {topicBreakdown.length === 0 && (
                <div className="text-slate-500 text-sm text-center py-4">No topic data yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Middle/Right Col: Badges & History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-400" />
              Achievements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {profile.badges.map(badge => (
                <div 
                  key={badge.id} 
                  className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                    badge.earned 
                      ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]" 
                      : "bg-slate-900/50 border-white/5 opacity-50 grayscale"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    badge.earned ? "bg-primary/20 text-primary" : "bg-slate-800 text-slate-500"
                  }`}>
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-sm text-slate-200 leading-tight">{badge.name}</div>
                  <div className="text-xs text-slate-400 line-clamp-2">{badge.description}</div>
                </div>
              ))}
              {profile.badges.length === 0 && (
                <div className="col-span-full text-slate-500 text-center py-8">
                  Complete debates to earn badges.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Swords className="w-5 h-5 text-indigo-400" />
              Recent Battles
            </h3>
            <div className="space-y-3">
              {recentDebates.map(debate => (
                <div key={debate.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{debate.topic}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(debate.createdAt).toLocaleDateString()} • {debate.messageCount} messages
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase font-medium">Score</div>
                      <div className="font-bold text-emerald-400">{debate.totalScore || 0}<span className="text-slate-600 text-xs">/30</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase font-medium">Earned</div>
                      <div className="font-bold text-primary">+{debate.xpEarned || 0} XP</div>
                    </div>
                  </div>
                </div>
              ))}
              {recentDebates.length === 0 && (
                <div className="text-slate-500 text-center py-8">No recent debates found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
