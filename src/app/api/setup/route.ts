import { pool } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return NextResponse.json({ 
      error: "DATABASE_URL is missing!", 
      hint: "Add it in Render Dashboard -> Settings -> Environment Variables" 
    }, { status: 500 });
  }

  let client;
  try {
    client = await pool.connect();
    
    // Очистка и создание таблиц
    await client.query(`DROP TABLE IF EXISTS players CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS rooms CASCADE;`);

    await client.query(`
      CREATE TABLE rooms (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'lobby' NOT NULL,
        character TEXT,
        spy_id INTEGER,
        start_time TIMESTAMP,
        duration INTEGER DEFAULT 480 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        is_host BOOLEAN DEFAULT FALSE NOT NULL,
        is_spy BOOLEAN DEFAULT FALSE NOT NULL,
        last_active TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    return NextResponse.json({ 
      success: true, 
      message: "Database schema initialized successfully." 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Database error", 
      message: error.message
    }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
