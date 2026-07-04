import { pool } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = await pool.connect();
  try {
    // SQL для создания таблиц
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'lobby',
        character TEXT,
        spy_id INTEGER,
        start_time TIMESTAMP,
        duration INTEGER DEFAULT 480 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        is_host BOOLEAN DEFAULT FALSE NOT NULL,
        is_spy BOOLEAN DEFAULT FALSE NOT NULL,
        last_active TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    return NextResponse.json({ message: "Database setup successful. Tables created." });
  } catch (error: any) {
    console.error("SETUP ERROR:", error);
    return NextResponse.json({ 
      error: "Setup failed", 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}
