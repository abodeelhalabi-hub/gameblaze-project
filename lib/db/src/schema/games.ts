import { pgTable, text, integer, bigint, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamesTable = pgTable("games", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  story: text("story"),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull().default(0),
  cover: text("cover"),
  screenshots: jsonb("screenshots").$type<string[]>().notNull().default([]),
  systemMin: jsonb("system_min").$type<{ cpu?: string; gpu?: string; ram?: string } | null>(),
  systemRec: jsonb("system_rec").$type<{ cpu?: string; gpu?: string; ram?: string } | null>(),
  downloadCount: integer("download_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({
  downloadCount: true,
  viewCount: true,
  createdAt: true,
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
