import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, debateSessionsTable, debateMessagesTable, userProfileTable } from "@workspace/db";
import {
  StartDebateBody,
  SendMessageBody,
  SendMessageParams,
  GetDebateParams,
  EndDebateParams,
  GetScoreParams,
} from "@workspace/api-zod";
import {
  generateAIResponse,
  generateInitialAIMessage,
  generateId,
  scoreDebateWithAI,
  calculateXP,
} from "../lib/debateEngine.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

async function ensureProfile() {
  const existing = await db.select().from(userProfileTable).limit(1);
  if (existing.length === 0) {
    const [profile] = await db.insert(userProfileTable).values({ xp: 0, level: 1, totalDebates: 0, streak: 0 }).returning();
    return profile;
  }
  return existing[0];
}

function formatSession(s: typeof debateSessionsTable.$inferSelect) {
  return {
    id: s.id,
    topic: s.topic,
    position: s.position,
    status: s.status,
    messageCount: s.messageCount,
    logicScore: s.logicScore,
    clarityScore: s.clarityScore,
    confidenceScore: s.confidenceScore,
    totalScore: s.totalScore,
    xpEarned: s.xpEarned,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function formatMessage(m: typeof debateMessagesTable.$inferSelect) {
  return {
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

router.post("/debates/start", async (req, res): Promise<void> => {
  const parsed = StartDebateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { topic, position } = parsed.data;
  const sessionId = generateId();
  const initialAiContent = generateInitialAIMessage(topic, position ?? undefined);
  const aiMessageId = generateId();

  await db.insert(debateSessionsTable).values({
    id: sessionId,
    topic,
    position: position ?? null,
    status: "active",
    logicScore: 5,
    clarityScore: 5,
    confidenceScore: 5,
  });

  await db.insert(debateMessagesTable).values({
    id: aiMessageId,
    sessionId,
    role: "ai",
    content: initialAiContent,
  });

  await db.update(debateSessionsTable)
    .set({ messageCount: 1 })
    .where(eq(debateSessionsTable.id, sessionId));

  const [session] = await db.select().from(debateSessionsTable).where(eq(debateSessionsTable.id, sessionId));

  req.log.info({ sessionId, topic }, "Debate started");
  res.status(201).json(formatSession(session));
});

router.get("/debates", async (_req, res): Promise<void> => {
  const sessions = await db.select().from(debateSessionsTable).orderBy(desc(debateSessionsTable.createdAt));
  res.json(sessions.map(formatSession));
});

router.get("/debates/:sessionId", async (req, res): Promise<void> => {
  const params = GetDebateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db.select().from(debateSessionsTable).where(eq(debateSessionsTable.id, params.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "Debate session not found" });
    return;
  }

  const messages = await db.select().from(debateMessagesTable)
    .where(eq(debateMessagesTable.sessionId, params.data.sessionId))
    .orderBy(debateMessagesTable.createdAt);

  const logic = session.logicScore ?? 5;
  const clarity = session.clarityScore ?? 5;
  const confidence = session.confidenceScore ?? 5;

  res.json({
    session: formatSession(session),
    messages: messages.map(formatMessage),
    score: {
      logic,
      clarity,
      confidence,
      total: logic + clarity + confidence,
      feedback: "Keep debating to improve your score!",
      messagesSinceLastEval: session.messageCount % 3,
    },
  });
});

router.post("/debates/:sessionId/end", async (req, res): Promise<void> => {
  const params = EndDebateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db.select().from(debateSessionsTable).where(eq(debateSessionsTable.id, params.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "Debate session not found" });
    return;
  }

  const logic = session.logicScore ?? 5;
  const clarity = session.clarityScore ?? 5;
  const confidence = session.confidenceScore ?? 5;
  const total = logic + clarity + confidence;
  const xpEarned = calculateXP(total, session.messageCount);

  await db.update(debateSessionsTable)
    .set({ status: "completed", totalScore: total, xpEarned })
    .where(eq(debateSessionsTable.id, params.data.sessionId));

  const profile = await ensureProfile();
  const today = new Date().toISOString().split("T")[0];
  const lastDate = profile.lastDebateDate;
  let newStreak = profile.streak;
  if (lastDate) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (lastDate === yesterday) {
      newStreak += 1;
    } else if (lastDate !== today) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  await db.update(userProfileTable)
    .set({
      xp: profile.xp + xpEarned,
      totalDebates: profile.totalDebates + 1,
      streak: newStreak,
      lastDebateDate: today,
    })
    .where(eq(userProfileTable.id, profile.id));

  const [updated] = await db.select().from(debateSessionsTable).where(eq(debateSessionsTable.id, params.data.sessionId));
  req.log.info({ sessionId: params.data.sessionId, xpEarned }, "Debate ended");
  res.json(formatSession(updated));
});

router.post("/debates/:sessionId/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [session] = await db.select().from(debateSessionsTable).where(eq(debateSessionsTable.id, params.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "Debate session not found" });
    return;
  }

  if (session.status !== "active") {
    res.status(400).json({ error: "Debate session is not active" });
    return;
  }

  // Save user message
  const userMessageId = generateId();
  await db.insert(debateMessagesTable).values({
    id: userMessageId,
    sessionId: params.data.sessionId,
    role: "user",
    content: body.data.content,
  });

  // Fetch full conversation history
  const allMessages = await db.select()
    .from(debateMessagesTable)
    .where(eq(debateMessagesTable.sessionId, params.data.sessionId))
    .orderBy(debateMessagesTable.createdAt);

  const chatHistory = allMessages.map((m) => ({
    role: m.role as "user" | "ai",
    content: m.content,
  }));

  // Generate AI response and score in parallel using real AI
  const [aiContent, newScore] = await Promise.all([
    generateAIResponse(session.topic, body.data.content, chatHistory),
    scoreDebateWithAI(
      session.topic,
      allMessages.filter((m) => m.role === "user").map((m) => m.content),
      session.logicScore ?? 5,
      session.clarityScore ?? 5,
      session.confidenceScore ?? 5,
    ),
  ]);

  // Save AI response
  const aiMessageId = generateId();
  await db.insert(debateMessagesTable).values({
    id: aiMessageId,
    sessionId: params.data.sessionId,
    role: "ai",
    content: aiContent,
  });

  // Update session scores
  const userMsgCount = allMessages.filter((m) => m.role === "user").length + 1;
  await db.update(debateSessionsTable)
    .set({
      messageCount: session.messageCount + 2,
      logicScore: newScore.logic,
      clarityScore: newScore.clarity,
      confidenceScore: newScore.confidence,
      totalScore: newScore.total,
    })
    .where(eq(debateSessionsTable.id, params.data.sessionId));

  const [userMsg] = await db.select().from(debateMessagesTable).where(eq(debateMessagesTable.id, userMessageId));
  const [aiMsg] = await db.select().from(debateMessagesTable).where(eq(debateMessagesTable.id, aiMessageId));

  res.json({
    userMessage: formatMessage(userMsg),
    aiMessage: formatMessage(aiMsg),
    score: {
      logic: newScore.logic,
      clarity: newScore.clarity,
      confidence: newScore.confidence,
      total: newScore.total,
      feedback: newScore.feedback,
      messagesSinceLastEval: userMsgCount % 3,
    },
  });
});

router.get("/debates/:sessionId/score", async (req, res): Promise<void> => {
  const params = GetScoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db.select().from(debateSessionsTable).where(eq(debateSessionsTable.id, params.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "Debate session not found" });
    return;
  }

  const logic = session.logicScore ?? 5;
  const clarity = session.clarityScore ?? 5;
  const confidence = session.confidenceScore ?? 5;
  const total = logic + clarity + confidence;

  let feedback = "Keep debating to improve your score!";
  if (total >= 25) feedback = "Excellent debating! Your arguments are logical, clear, and confident.";
  else if (total >= 18) feedback = "Strong arguments! You're showing good logical reasoning and clarity.";
  else if (total >= 10) feedback = "You're making good points. Consider adding more concrete evidence.";

  res.json({
    logic,
    clarity,
    confidence,
    total,
    feedback,
    messagesSinceLastEval: session.messageCount % 3,
  });
});

export default router;
