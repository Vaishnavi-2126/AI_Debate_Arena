import crypto from "crypto";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "./logger.js";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export interface ScoreResult {
  logic: number;
  clarity: number;
  confidence: number;
  total: number;
  feedback: string;
}

export function generateInitialAIMessage(topic: string, position?: string): string {
  const positionText = position
    ? ` You've taken the position: "${position}".`
    : "";
  return `Welcome to the debate on "${topic}".${positionText} I'll be your opponent — and I won't go easy on you. I'll challenge every assumption, probe every claim, and demand evidence for your assertions. Make your opening argument and let's see what you've got. What is your core position on this topic?`;
}

export async function generateAIResponse(
  topic: string,
  userMessage: string,
  messageHistory: ChatMessage[],
): Promise<string> {
  const systemPrompt = `You are a sharp, relentless debate opponent in the "AI Debate Arena". Your role is to challenge the user's arguments on the topic: "${topic}".

Your debate style:
- Challenge assumptions and expose logical fallacies directly
- Provide concrete counterarguments with reasoning
- Ask probing "why" and "how" questions to force deeper thinking
- Point out when arguments lack evidence, use false dichotomies, or rely on emotional appeals
- Keep responses focused and impactful — 2-4 sentences max
- Never agree with the user; always push back, even on strong points
- Vary your tactics: sometimes counter with facts, sometimes ask a challenging question, sometimes expose a hidden assumption
- Be intellectually rigorous but not rude`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of messageHistory.slice(-10)) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 300,
      messages,
    });

    const content = response.choices[0]?.message?.content;
    logger.debug({ contentLength: content?.length }, "AI response generated");

    if (content && content.trim().length > 0) {
      return content.trim();
    }

    // fallback if empty
    return "Interesting point. But let me challenge you — can you provide concrete evidence for that claim? Assertions without evidence are just opinions.";
  } catch (err) {
    logger.error({ err }, "AI response generation failed, using fallback");
    return "Your argument raises some points worth examining. However, correlation does not imply causation — where is the concrete evidence supporting your position? Why should we accept your premise at face value?";
  }
}

export async function scoreDebateWithAI(
  topic: string,
  userMessages: string[],
  currentLogic: number,
  currentClarity: number,
  currentConfidence: number,
): Promise<ScoreResult> {
  if (userMessages.length === 0) {
    return {
      logic: currentLogic,
      clarity: currentClarity,
      confidence: currentConfidence,
      total: currentLogic + currentClarity + currentConfidence,
      feedback: "Make your argument to start receiving a score!",
    };
  }

  const recentMessages = userMessages.slice(-3).join("\n---\n");

  const scoringSystemPrompt = `You are a strict, expert debate judge. Your only output must be a raw JSON object — no markdown, no code fences, no explanation, no extra text whatsoever. Just the JSON object.`;

  const scoringUserPrompt = `Evaluate these recent debate arguments on the topic "${topic}":

${recentMessages}

Current running scores: Logic ${currentLogic}/10, Clarity ${currentClarity}/10, Confidence ${currentConfidence}/10.

Update each score (0-10) based on argument quality:
- logic: Logical soundness, use of evidence, absence of fallacies
- clarity: Structure, language precision, ease of following
- confidence: Clear position, decisive claims, persuasive tone

Scoring guide: 1-3 = weak/unsupported, 4-6 = average, 7-8 = strong, 9-10 = exceptional.
One-line arguments with no evidence should score 2-4. Arguments with statistics and reasoning score 6-8.

Return ONLY this JSON (no other text):
{"logic":NUMBER,"clarity":NUMBER,"confidence":NUMBER,"feedback":"ONE_SENTENCE_FEEDBACK"}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 150,
      messages: [
        { role: "system", content: scoringSystemPrompt },
        { role: "user", content: scoringUserPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";
    logger.debug({ content }, "AI scoring response");

    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[^}]+\}/s);
    if (!jsonMatch) {
      logger.warn({ content }, "No JSON found in scoring response, using heuristic");
      return heuristicScore(userMessages, currentLogic, currentClarity, currentConfidence);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const logic = Math.min(10, Math.max(0, Math.round(Number(parsed.logic))));
    const clarity = Math.min(10, Math.max(0, Math.round(Number(parsed.clarity))));
    const confidence = Math.min(10, Math.max(0, Math.round(Number(parsed.confidence))));

    if (isNaN(logic) || isNaN(clarity) || isNaN(confidence)) {
      return heuristicScore(userMessages, currentLogic, currentClarity, currentConfidence);
    }

    return {
      logic,
      clarity,
      confidence,
      total: logic + clarity + confidence,
      feedback: String(parsed.feedback ?? "Keep developing your arguments with more evidence and structure."),
    };
  } catch (err) {
    logger.error({ err }, "AI scoring failed, using heuristic fallback");
    return heuristicScore(userMessages, currentLogic, currentClarity, currentConfidence);
  }
}

function heuristicScore(
  userMessages: string[],
  currentLogic: number,
  currentClarity: number,
  currentConfidence: number,
): ScoreResult {
  const lastMsg = userMessages[userMessages.length - 1] ?? "";
  const wordCount = lastMsg.split(/\s+/).length;
  const hasEvidence = /because|since|therefore|evidence|research|study|data|fact|according/i.test(lastMsg);
  const hasStructure = /first|second|furthermore|however|although|while|despite/i.test(lastMsg);
  const hasConfidence = /clearly|undoubtedly|certainly|I argue|I contend|I maintain/i.test(lastMsg);

  let logic = currentLogic + (hasEvidence ? 1 : -1) + (wordCount > 30 ? 1 : 0);
  let clarity = currentClarity + (hasStructure ? 1 : 0) + (wordCount > 15 && wordCount < 120 ? 1 : -1);
  let confidence = currentConfidence + (hasConfidence ? 1 : 0) + (wordCount > 10 ? 1 : -1);

  logic = Math.min(10, Math.max(1, logic));
  clarity = Math.min(10, Math.max(1, clarity));
  confidence = Math.min(10, Math.max(1, confidence));

  const total = logic + clarity + confidence;
  let feedback = "Add more evidence and structure to strengthen your arguments.";
  if (total >= 24) feedback = "Excellent arguments — well-reasoned, clear, and confident.";
  else if (total >= 18) feedback = "Strong reasoning. Try to add more concrete evidence.";
  else if (total >= 12) feedback = "Decent arguments. Work on clarity and logical structure.";

  return { logic, clarity, confidence, total, feedback };
}

export function calculateXP(totalScore: number, messageCount: number): number {
  const baseXP = totalScore * 5;
  const participationBonus = Math.min(messageCount * 2, 20);
  return baseXP + participationBonus;
}

export function getLevelInfo(xp: number): { level: number; levelName: string; xpToNextLevel: number } {
  const levels = [
    { threshold: 0, name: "Beginner" },
    { threshold: 100, name: "Apprentice" },
    { threshold: 250, name: "Intermediate" },
    { threshold: 500, name: "Advanced" },
    { threshold: 1000, name: "Pro" },
    { threshold: 2000, name: "Expert" },
    { threshold: 5000, name: "Master" },
  ];

  let level = 1;
  let levelName = "Beginner";
  let xpToNextLevel = 100;

  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].threshold) {
      level = i + 1;
      levelName = levels[i].name;
      xpToNextLevel = i + 1 < levels.length ? levels[i + 1].threshold - xp : 0;
    }
  }

  return { level, levelName, xpToNextLevel: Math.max(0, xpToNextLevel) };
}

export function getBadges(
  profile: { xp: number; totalDebates: number },
  debates: Array<{ totalScore: number | null; clarityScore: number | null; confidenceScore: number | null; logicScore: number | null }>,
): Array<{ id: string; name: string; description: string; earned: boolean; earnedAt: string | null }> {
  const badges = [
    {
      id: "first_debate",
      name: "Arena Entrant",
      description: "Complete your first debate",
      earned: profile.totalDebates >= 1,
    },
    {
      id: "debate_veteran",
      name: "Debate Veteran",
      description: "Complete 5 debates",
      earned: profile.totalDebates >= 5,
    },
    {
      id: "strong_thinker",
      name: "Strong Thinker",
      description: "Achieve a logic score of 8+ in a debate",
      earned: debates.some((d) => (d.logicScore ?? 0) >= 8),
    },
    {
      id: "confident_speaker",
      name: "Confident Speaker",
      description: "Achieve a confidence score of 8+ in a debate",
      earned: debates.some((d) => (d.confidenceScore ?? 0) >= 8),
    },
    {
      id: "logic_master",
      name: "Logic Master",
      description: "Achieve a total score of 25+ in a debate",
      earned: debates.some((d) => (d.totalScore ?? 0) >= 25),
    },
    {
      id: "xp_collector",
      name: "XP Collector",
      description: "Earn 500 XP",
      earned: profile.xp >= 500,
    },
    {
      id: "wordsmith",
      name: "Wordsmith",
      description: "Achieve clarity score of 9+ in a debate",
      earned: debates.some((d) => (d.clarityScore ?? 0) >= 9),
    },
  ];

  return badges.map((b) => ({
    ...b,
    earnedAt: b.earned ? new Date().toISOString() : null,
  }));
}

export function generateId(): string {
  return crypto.randomUUID();
}
