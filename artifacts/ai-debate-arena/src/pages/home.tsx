import { useLocation } from "wouter";
import { useGetProfile, useStartDebate } from "@workspace/api-client-react";
import { Brain, Zap, Swords, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const PRESET_TOPICS = [
  "Artificial Intelligence will eventually replace most human jobs.",
  "Social Media has a net negative effect on society.",
  "Universal Basic Income is necessary for the future.",
  "Space exploration is a waste of resources.",
  "Remote work is better than office work.",
  "Privacy is more important than national security."
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: isProfileLoading } = useGetProfile();
  const startDebate = useStartDebate();
  
  const [customTopic, setCustomTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  
  const handleStart = () => {
    const topic = customTopic.trim() || selectedTopic;
    if (!topic) return;
    
    startDebate.mutate({ data: { topic } }, {
      onSuccess: (session) => {
        setLocation(`/debate/${session.id}`);
      }
    });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 flex flex-col gap-12">
      {/* Hero / Profile Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Welcome to the Arena</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            Challenge the <br/>
            <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              Machine Mind
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-xl">
            Engage in high-stakes intellectual combat. Defend your positions, expose logical fallacies, and earn your place among the greatest thinkers.
          </p>
        </div>

        {/* Mini Stats Card */}
        {isProfileLoading ? (
          <div className="glass-panel rounded-2xl p-6 w-full md:w-80 h-48 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="glass-panel rounded-2xl p-6 w-full md:w-80 shrink-0 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Brain className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-400">Level {profile.level}</div>
                  <div className="font-bold text-lg">{profile.levelName}</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-amber-400">
                  <Zap className="w-4 h-4 fill-current" />
                  <span className="font-bold">{profile.streak}</span>
                </div>
                <div className="text-xs text-slate-500">Day Streak</div>
              </div>
            </div>
            
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">XP Progress</span>
                <span className="text-primary">{profile.xp} / {profile.xp + profile.xpToNextLevel}</span>
              </div>
              <Progress 
                value={(profile.xp / (profile.xp + profile.xpToNextLevel)) * 100} 
                className="h-2 bg-slate-800"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Topic Selection */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
        <div className="flex items-center gap-3">
          <Swords className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Choose your battleground</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESET_TOPICS.map((topic, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedTopic(topic);
                setCustomTopic("");
              }}
              className={`text-left p-5 rounded-2xl border transition-all duration-200 ${
                selectedTopic === topic && !customTopic
                  ? "bg-primary/20 border-primary shadow-[0_0_30px_-5px_rgba(124,58,237,0.3)]"
                  : "glass-panel hover:bg-white/5 hover:border-white/20"
              }`}
            >
              <p className="font-medium text-slate-200 leading-relaxed">{topic}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 py-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Or</span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="glass-panel rounded-2xl p-2 pl-6 flex items-center gap-4">
          <Input
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value);
              setSelectedTopic("");
            }}
            placeholder="Enter a custom debate topic..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg px-0 h-14"
          />
          <Button 
            size="lg"
            className="rounded-xl px-8 h-12 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] transition-all hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.6)]"
            disabled={(!customTopic.trim() && !selectedTopic) || startDebate.isPending}
            onClick={handleStart}
          >
            {startDebate.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="font-bold text-base">Enter Arena</span>
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
