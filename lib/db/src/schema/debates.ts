import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const debateSessionsTable = pgTable("debate_sessions", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  position: text("position"),
  status: text("status").notNull().default("active"),
  messageCount: integer("message_count").notNull().default(0),
  logicScore: integer("logic_score"),
  clarityScore: integer("clarity_score"),
  confidenceScore: integer("confidence_score"),
  totalScore: integer("total_score"),
  xpEarned: integer("xp_earned"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDebateSessionSchema = createInsertSchema(debateSessionsTable).omit({
  messageCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDebateSession = z.infer<typeof insertDebateSessionSchema>;
export type DebateSession = typeof debateSessionsTable.$inferSelect;

export const debateMessagesTable = pgTable("debate_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => debateSessionsTable.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDebateMessageSchema = createInsertSchema(debateMessagesTable).omit({
  createdAt: true,
});
export type InsertDebateMessage = z.infer<typeof insertDebateMessageSchema>;
export type DebateMessage = typeof debateMessagesTable.$inferSelect;

export const userProfileTable = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  totalDebates: integer("total_debates").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastDebateDate: text("last_debate_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserProfileSchema = createInsertSchema(userProfileTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfileTable.$inferSelect;
