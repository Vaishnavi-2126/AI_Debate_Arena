import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, displayName, password } = req.body;

  if (!username || !displayName || !password) {
    res.status(400).json({ error: "username, displayName, and password are required" });
    return;
  }
  if (username.length < 3 || username.length > 30) {
    res.status(400).json({ error: "Username must be 3–30 characters" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    username: username.toLowerCase(),
    displayName,
    passwordHash,
  }).returning();

  (req.session as any).userId = user.id;
  res.status(201).json({ id: user.id, username: user.username, displayName: user.displayName });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  (req.session as any).userId = user.id;
  res.json({ id: user.id, username: user.username, displayName: user.displayName });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({ id: user.id, username: user.username, displayName: user.displayName });
});

export default router;
