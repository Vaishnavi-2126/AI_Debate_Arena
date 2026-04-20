import crypto from "crypto";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

const COUNTERARGUMENT_TEMPLATES = [
  (topic: string, arg: string) =>
    `While you raise an interesting point about ${topic}, consider this: ${generateCounterpoint(arg)} Why do you believe your argument holds up against this counterpoint?`,
  (topic: string, arg: string) =>
    `Your argument shows some reasoning, but let me challenge the underlying assumption here. ${generateChallenge(arg)} How would you respond to this challenge?`,
  (_topic: string, arg: string) =>
    `I see what you're trying to argue. However, ${generateLogicalCritique(arg)} Can you strengthen your position?`,
  (topic: string, _arg: string) =>
    `The debate around ${topic} is more nuanced than your argument suggests. ${generateNuancePoint(topic)} What evidence do you have to support your position?`,
];

function generateCounterpoint(arg: string): string {
  const counterpoints = [
    "correlation does not imply causation — you're making a logical leap without sufficient evidence",
    "this argument relies on an appeal to authority without questioning whether that authority is reliable",
    "you're presenting a false dichotomy — there are more options than the two you've presented",
    "this is a hasty generalization — you're drawing broad conclusions from limited examples",
    "the evidence you're citing may be cherry-picked, ignoring contradicting data",
    "your argument assumes the current state of affairs will remain static, which rarely holds true",
    "this perspective neglects the systemic factors at play that complicate your conclusion",
  ];
  const idx = Math.abs(hashString(arg)) % counterpoints.length;
  return counterpoints[idx];
}

function generateChallenge(arg: string): string {
  const challenges = [
    "What happens if we scale this idea? The consequences become far less predictable at a broader scope.",
    "Your premise assumes a level of uniformity that doesn't exist in complex systems.",
    "Have you considered the second-order effects of your proposed position?",
    "The historical record shows this kind of reasoning has led to significant unintended consequences.",
    "You're optimizing for one variable while ignoring trade-offs that affect the broader system.",
    "This argument doesn't hold when examined from the perspective of those most affected.",
    "Your logic works in ideal conditions, but reality introduces friction that undermines this reasoning.",
  ];
  const idx = Math.abs(hashString(arg)) % challenges.length;
  return challenges[idx];
}

function generateLogicalCritique(arg: string): string {
  const critiques = [
    "the logical structure of your argument has a gap — you're assuming what you're trying to prove.",
    "you've made an assertion without adequate support. Where's the evidence?",
    "this conflates two different things that shouldn't be treated as equivalent.",
    "the analogy you're implicitly drawing breaks down upon closer inspection.",
    "this argument would logically lead to conclusions you'd likely reject yourself.",
    "you're appealing to what seems intuitive rather than what the evidence demonstrates.",
    "this reasoning contains a hidden assumption that, once revealed, weakens the whole argument.",
  ];
  const idx = Math.abs(hashString(arg)) % critiques.length;
  return critiques[idx];
}

function generateNuancePoint(topic: string): string {
  const nuances = [
    `Different stakeholders in the ${topic} debate hold fundamentally different values, making a single-perspective argument insufficient.`,
    `The empirical research on ${topic} is more contested than your argument implies — experts actively disagree.`,
    `Historical context around ${topic} shows that the situation is more complex than a simple judgment allows.`,
    `Your argument treats ${topic} as a solved problem when it remains an active area of debate among experts.`,
    `The impact of positions on ${topic} varies significantly depending on geography, culture, and socioeconomic context.`,
  ];
  const idx = Math.abs(hashString(topic)) % nuances.length;
  return nuances[idx];
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

export function generateAIResponse(
  topic: string,
  userMessage: string,
  messageHistory: ChatMessage[],
): string {
  const messageCount = messageHistory.length;
  const templateIdx = messageCount % COUNTERARGUMENT_TEMPLATES.length;
  const template = COUNTERARGUMENT_TEMPLATES[templateIdx];
  return template(topic, userMessage);
}

export function generateInitialAIMessage(topic: string, position?: string): string {
  const positionText = position
    ? ` You've taken the position: "${position}".`
    : "";
  return `Welcome to the debate on "${topic}".${positionText} I'll be your opponent — and I won't go easy on you. I'll challenge every assumption, probe every claim, and demand evidence for your assertions. Make your opening argument and let's see what you've got. What is your core position on this topic?`;
}

export function scoreDebate(
  messages: ChatMessage[],
  currentLogic: number,
  currentClarity: number,
  currentConfidence: number,
): { logic: number; clarity: number; confidence: number; total: number; feedback: string } {
  const userMessages = messages.filter((m) => m.role === "user");

  if (userMessages.length === 0) {
    return {
      logic: currentLogic,
      clarity: currentClarity,
      confidence: currentConfidence,
      total: currentLogic + currentClarity + currentConfidence,
      feedback: "Keep debating to improve your score!",
    };
  }

  const lastUserMsg = userMessages[userMessages.length - 1].content;
  const wordCount = lastUserMsg.split(/\s+/).length;
  const hasEvidence = /because|since|therefore|evidence|research|study|data|fact|according/i.test(lastUserMsg);
  const hasStructure = /first|second|third|furthermore|however|although|while|despite/i.test(lastUserMsg);
  const hasConfidence = /clearly|obviously|undoubtedly|certainly|definitely|I believe|I argue|I contend/i.test(lastUserMsg);
  const hasQuestions = lastUserMsg.includes("?");
  const hasExamples = /example|instance|such as|for instance|like|case/i.test(lastUserMsg);

  let logicDelta = 0;
  let clarityDelta = 0;
  let confidenceDelta = 0;

  if (hasEvidence) logicDelta += 2;
  if (hasExamples) logicDelta += 1;
  if (wordCount < 10) logicDelta -= 1;
  if (wordCount > 30) logicDelta += 1;

  if (hasStructure) clarityDelta += 2;
  if (wordCount > 20 && wordCount < 100) clarityDelta += 1;
  if (hasQuestions) clarityDelta -= 1;

  if (hasConfidence) confidenceDelta += 2;
  if (wordCount > 15) confidenceDelta += 1;

  const newLogic = Math.min(10, Math.max(1, currentLogic + logicDelta));
  const newClarity = Math.min(10, Math.max(1, currentClarity + clarityDelta));
  const newConfidence = Math.min(10, Math.max(1, currentConfidence + confidenceDelta));
  const total = newLogic + newClarity + newConfidence;

  let feedback = "";
  if (total <= 10) {
    feedback = "Your arguments need more structure and evidence. Try using facts to back your claims.";
  } else if (total <= 18) {
    feedback = "You're making some good points. Consider adding more concrete evidence and clearer structure.";
  } else if (total <= 24) {
    feedback = "Strong arguments! You're showing good logical reasoning and clarity.";
  } else {
    feedback = "Excellent debating! Your arguments are logical, clear, and confident.";
  }

  return { logic: newLogic, clarity: newClarity, confidence: newConfidence, total, feedback };
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
