import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").$type<"lobby" | "playing" | "finished">().default("lobby").notNull(),
  winner: text("winner"), // 'spy' or 'citizens'
  character: text("character"),
  spyId: integer("spy_id"),
  startTime: timestamp("start_time"),
  duration: integer("duration").default(480).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  isHost: boolean("is_host").default(false).notNull(),
  isSpy: boolean("is_spy").default(false).notNull(),
  votedFor: integer("voted_for"), // ID of player being voted for
  lastActive: timestamp("last_active").defaultNow().notNull(),
});