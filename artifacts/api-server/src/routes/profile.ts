import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, debateSessionsTable, userProfileTable } from "@workspace/db";
import { getLevelInfo, getBadges } from "../lib/debateEngine.js";

const router: IRouter = Router();

async function ensureProfile() {
  const existing = await db.select().from(userProfileTable).limit(1);
  if (existing.length === 0) {
    const [profile] = await db.insert(userProfileTable).values({ xp: 0, level: 1, totalDebates: 0, streak: 0 }).returning();
    return profile;
  }
  return existing[0];
}

router.get("/profile", async (req, res): Promise<void> => {
  const profile = await ensureProfile();
  const { level, levelName, xpToNextLevel } = getLevelInfo(profile.xp);

  const debates = await db.select().from(debateSessionsTable)
    .where(eq(debateSessionsTable.status, "completed"));

  const badges = getBadges(
    { xp: profile.xp, totalDebates: profile.totalDebates },
    debates.map((d) => ({
      totalScore: d.totalScore,
      clarityScore: d.clarityScore,
      confidenceScore: d.confidenceScore,
      logicScore: d.logicScore,
    })),
  );

  res.json({
    xp: profile.xp,
    level,
    levelName,
    xpToNextLevel,
    totalDebates: profile.totalDebates,
    streak: profile.streak,
    badges,
  });
});

router.get("/profile/dashboard", async (req, res): Promise<void> => {
  const profile = await ensureProfile();
  const { level, levelName, xpToNextLevel } = getLevelInfo(profile.xp);

  const allDebates = await db.select().from(debateSessionsTable)
    .orderBy(desc(debateSessionsTable.createdAt));

  const completedDebates = allDebates.filter((d) => d.status === "completed");

  const badges = getBadges(
    { xp: profile.xp, totalDebates: profile.totalDebates },
    completedDebates.map((d) => ({
      totalScore: d.totalScore,
      clarityScore: d.clarityScore,
      confidenceScore: d.confidenceScore,
      logicScore: d.logicScore,
    })),
  );

  const totalScore = completedDebates.reduce((sum, d) => sum + (d.totalScore ?? 0), 0);
  const averageScore = completedDebates.length > 0 ? totalScore / completedDebates.length : 0;

  const topicMap: Record<string, { count: number; totalScore: number }> = {};
  for (const d of completedDebates) {
    if (!topicMap[d.topic]) topicMap[d.topic] = { count: 0, totalScore: 0 };
    topicMap[d.topic].count += 1;
    topicMap[d.topic].totalScore += d.totalScore ?? 0;
  }

  const topicBreakdown = Object.entries(topicMap).map(([topic, data]) => ({
    topic,
    count: data.count,
    avgScore: data.count > 0 ? data.totalScore / data.count : 0,
  }));

  let bestTopic: string | null = null;
  if (topicBreakdown.length > 0) {
    bestTopic = topicBreakdown.reduce((best, curr) =>
      curr.avgScore > best.avgScore ? curr : best
    ).topic;
  }

  const recentDebates = allDebates.slice(0, 5).map((s) => ({
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
  }));

  res.json({
    profile: {
      xp: profile.xp,
      level,
      levelName,
      xpToNextLevel,
      totalDebates: profile.totalDebates,
      streak: profile.streak,
      badges,
    },
    totalDebates: profile.totalDebates,
    averageScore: Math.round(averageScore * 10) / 10,
    bestTopic,
    recentDebates,
    topicBreakdown,
  });
});

export default router;
