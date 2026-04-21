import { useRoute, useLocation } from "wouter";
import { useGetDebate } from "@workspace/api-client-react";
import { Loader2, ArrowRight, Trophy, Brain, Target, Shield, TrendingUp, Medal, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function MetricRing({ label, value, icon: Icon, colorClass }: { label: string, value: number, icon: any, colorClass: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((value / 10) * circumference);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Background ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
          <circle 
            cx="48" cy="48" r={radius} 
            stroke="currentColor" 
            strokeWidth="8" 
            fill="none" 
            className="text-slate-800"
          />
          {/* Progress ring */}
          <circle 
            cx="48" cy="48" r={radius} 
            stroke="currentColor" 
            strokeWidth="8" 
            fill="none" 
            strokeLinecap="round"
            className={`${colorClass} drop-shadow-lg transition-all duration-1000 ease-out`}
            style={{ 
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset
            }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black text-white">{value}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        {label}
      </div>
    </div>
  );
}

export default function Results() {
  const [, params] = useRoute("/debate/:sessionId/results");
  const sessionId = params?.sessionId;
  const [, setLocation] = useLocation();

  const { data: debateData, isLoading } = useGetDebate(sessionId || "", {
    query: { enabled: !!sessionId }
  });

  const handleDownload = () => {
    if (!debateData) return;
    const { session, messages } = debateData;
    const lines: string[] = [
      `AI Debate Arena — Final Transcript`,
      `Topic: ${session.topic}`,
      `Date: ${new Date(session.createdAt).toLocaleString()}`,
      ``,
      `Final Scores`,
      `  Logic:      ${session.logicScore ?? 0}/10`,
      `  Clarity:    ${session.clarityScore ?? 0}/10`,
      `  Confidence: ${session.confidenceScore ?? 0}/10`,
      `  Total:      ${session.totalScore ?? 0}/30`,
      `  XP Earned:  +${session.xpEarned ?? 0}`,
      ``,
      `─────────────────────────────────────────`,
      ``,
    ];
    for (const msg of messages ?? []) {
      const speaker = msg.role === "ai" ? "AI Opponent" : "You";
      const time = new Date(msg.createdAt).toLocaleTimeString();
      lines.push(`[${time}] ${speaker}:`);
      lines.push(msg.content);
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debate-${session.topic.replace(/\s+/g, "-").slice(0, 40)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!debateData) return null;

  const { session, score } = debateData;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center border-2 border-primary shadow-[0_0_40px_rgba(124,58,237,0.5)] mb-4">
          <Trophy className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Debate Concluded</h1>
          <p className="text-lg text-slate-400 font-medium">Topic: {session.topic}</p>
        </div>

        {/* Main Score Card */}
        <div className="w-full glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden mt-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-2xl bg-primary/10 rounded-full blur-[100px] -z-10" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-center border-b border-white/10 pb-12 mb-12">
            <MetricRing label="Logic" value={session.logicScore || 0} icon={Target} colorClass="text-blue-400" />
            
            <div className="flex flex-col items-center justify-center bg-slate-900/80 rounded-full w-40 h-40 mx-auto border-4 border-primary/30 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Score</span>
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                {session.totalScore || 0}
              </span>
              <span className="text-sm font-bold text-slate-500 mt-1">/ 30</span>
            </div>

            <MetricRing label="Clarity" value={session.clarityScore || 0} icon={Shield} colorClass="text-emerald-400" />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Feedback Section */}
            <div className="text-left space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Brain className="w-6 h-6 text-primary" />
                AI Analysis
              </h3>
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/5 text-slate-300 leading-relaxed text-sm md:text-base">
                {score?.feedback || "No feedback available."}
              </div>
            </div>

            {/* Rewards Section */}
            <div className="text-left space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Medal className="w-6 h-6 text-amber-400" />
                Rewards Earned
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <span className="font-bold text-primary">Experience Gained</span>
                  <span className="text-2xl font-black text-white">+{session.xpEarned || 0} XP</span>
                </div>
                
                {/* Visual placeholder for potential badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-white/5">
                    <TrendingUp className="w-8 h-8 text-slate-600" />
                    <div>
                      <div className="text-xs text-slate-500 font-bold uppercase">Confidence</div>
                      <div className="text-sm text-slate-300">{session.confidenceScore}/10</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-white/5">
                    <Shield className="w-8 h-8 text-slate-600" />
                    <div>
                      <div className="text-xs text-slate-500 font-bold uppercase">Messages</div>
                      <div className="text-sm text-slate-300">{session.messageCount} total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 justify-center">
          <Button
            size="lg"
            onClick={() => setLocation("/")}
            className="rounded-xl px-8 h-14 bg-white text-black hover:bg-slate-200 font-bold text-lg transition-all shadow-xl"
          >
            New Debate
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="rounded-xl px-8 h-14 font-bold text-lg border-white/20 hover:bg-white/10"
          >
            View Dashboard
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleDownload}
            className="rounded-xl px-8 h-14 font-bold text-lg border-white/20 hover:bg-white/10"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Transcript
          </Button>
        </div>

      </div>
    </div>
  );
}
