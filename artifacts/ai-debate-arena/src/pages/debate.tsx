import { useRoute } from "wouter";
import { useGetDebate, useSendMessage, useEndDebate } from "@workspace/api-client-react";
import { Loader2, Send, Brain, User, AlertCircle, TrendingUp, Target, Shield, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 p-4 max-w-[100px] glass-panel rounded-2xl rounded-tl-sm text-slate-400">
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
    </div>
  );
}

function ScoreBar({ label, value, icon: Icon, colorClass }: { label: string, value: number, icon: any, colorClass: string }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between text-xs font-medium">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
          {label}
        </span>
        <span className="text-slate-400">{value}/10</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out bg-current ${colorClass}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function Debate() {
  const [, params] = useRoute("/debate/:sessionId");
  const sessionId = params?.sessionId;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const debateQueryKey = ["debate", sessionId];

  const { data: debateData, isLoading: isDebateLoading } = useGetDebate(sessionId || "", {
    query: { enabled: !!sessionId, queryKey: debateQueryKey }
  });

  const sendMessage = useSendMessage();
  const endDebate = useEndDebate();

  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debateData?.messages, sendMessage.isPending]);

  const handleSend = () => {
    if (!content.trim() || !sessionId || sendMessage.isPending) return;

    const msgContent = content.trim();
    setContent("");

    // Optimistically show the user message immediately
    queryClient.setQueryData(debateQueryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [
          ...old.messages,
          {
            id: "__optimistic__",
            sessionId,
            role: "user",
            content: msgContent,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });

    sendMessage.mutate({ sessionId, data: { content: msgContent } }, {
      onSuccess: (result) => {
        // Replace optimistic entry with real server data (includes AI reply)
        queryClient.setQueryData(debateQueryKey, (old: any) => {
          if (!old) return old;
          const filtered = old.messages.filter((m: any) => m.id !== "__optimistic__");
          return {
            ...old,
            messages: [...filtered, result.userMessage, result.aiMessage],
            session: {
              ...old.session,
              logicScore: result.score.logic,
              clarityScore: result.score.clarity,
              confidenceScore: result.score.confidence,
              totalScore: result.score.total,
              messageCount: (old.session.messageCount ?? 0) + 2,
            },
          };
        });
      },
      onError: () => {
        // Roll back optimistic message on error
        queryClient.setQueryData(debateQueryKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.filter((m: any) => m.id !== "__optimistic__"),
          };
        });
      },
    });
  };

  const handleEnd = () => {
    if (!sessionId) return;
    endDebate.mutate({ sessionId }, {
      onSuccess: () => {
        setLocation(`/debate/${sessionId}/results`);
      }
    });
  };

  const handleDownload = () => {
    if (!debateData) return;
    const { session, messages } = debateData;
    const lines: string[] = [
      `AI Debate Arena — Transcript`,
      `Topic: ${session.topic}`,
      `Date: ${new Date(session.createdAt).toLocaleString()}`,
      `Status: ${session.status}`,
      `Scores — Logic: ${session.logicScore}/10 | Clarity: ${session.clarityScore}/10 | Confidence: ${session.confidenceScore}/10`,
      `Total Score: ${session.totalScore ?? 0}/30`,
      ``,
      `─────────────────────────────────────────`,
      ``,
    ];

    for (const msg of messages) {
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

  if (isDebateLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!debateData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p>Debate session not found.</p>
        <Button onClick={() => setLocation("/")} variant="outline">Return Home</Button>
      </div>
    );
  }

  const { session, messages } = debateData;
  const liveScore = {
    logicScore: session.logicScore ?? 0,
    clarityScore: session.clarityScore ?? 0,
    confidenceScore: session.confidenceScore ?? 0,
  };

  return (
    <div className="flex-1 flex flex-col max-h-[calc(100vh-4rem)]">
      {/* Header Info */}
      <div className="glass-panel border-x-0 border-t-0 p-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold tracking-wider text-primary uppercase mb-1">Current Topic</div>
          <h2 className="text-lg font-medium text-slate-200 truncate" title={session.topic}>
            {session.topic}
          </h2>
        </div>

        {/* Live Score Panel */}
        <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-white/5 w-full md:w-auto">
          <div className="flex gap-4 flex-1">
            <ScoreBar label="Logic" value={liveScore.logicScore} icon={Target} colorClass="text-blue-400" />
            <ScoreBar label="Clarity" value={liveScore.clarityScore} icon={Shield} colorClass="text-emerald-400" />
            <ScoreBar label="Confidence" value={liveScore.confidenceScore} icon={TrendingUp} colorClass="text-amber-400" />
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEnd}
              disabled={endDebate.isPending}
              className="font-bold"
            >
              {endDebate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "End & Score"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={messages.length === 0}
              className="border-white/10 hover:bg-white/5 text-slate-300"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 z-10 scroll-smooth">
        {messages.length === 0 && !sendMessage.isPending && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium">The arena is ready. Make your opening statement.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isAi = msg.role === "ai";
          const isOptimistic = msg.id === "__optimistic__";
          return (
            <div key={msg.id} className={`flex gap-4 max-w-4xl ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border shadow-lg ${
                isAi
                  ? "bg-indigo-950 border-indigo-500/30"
                  : "bg-slate-800 border-slate-700"
              }`}>
                {isAi ? <Brain className="w-5 h-5 text-indigo-400" /> : <User className="w-5 h-5 text-slate-300" />}
              </div>

              <div className={`p-5 rounded-2xl text-slate-200 leading-relaxed shadow-xl transition-opacity ${
                isOptimistic ? "opacity-60" : "opacity-100"
              } ${
                isAi
                  ? "glass-panel rounded-tl-sm border-white/5"
                  : "bg-primary text-white rounded-tr-sm border border-primary-foreground/10"
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}

        {sendMessage.isPending && (
          <div className="flex gap-4 max-w-4xl mr-auto animate-in fade-in">
            <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 z-20 shrink-0">
        <div className="max-w-5xl mx-auto relative flex items-end gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Formulate your argument..."
            className="min-h-[60px] max-h-[200px] resize-none glass-panel border-white/10 rounded-2xl pr-14 text-base py-4 focus-visible:ring-1 focus-visible:ring-primary/50"
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!content.trim() || sendMessage.isPending}
            size="icon"
            className="absolute right-2 bottom-2 rounded-xl bg-primary hover:bg-primary/90 text-white w-10 h-10 shadow-lg transition-all"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="max-w-5xl mx-auto text-center mt-2">
          <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
            Press Enter to send · Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
