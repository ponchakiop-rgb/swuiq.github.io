import { db } from "@/db";
import { rooms, players } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, code } = await req.json();
    if (!name || !code) return NextResponse.json({ error: "Name and code are required" }, { status: 400 });

    const roomCode = code.toUpperCase();
    const [room] = await db.select().from(rooms).where(eq(rooms.code, roomCode)).limit(1);

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.status !== "lobby") return NextResponse.json({ error: "Game already started or finished" }, { status: 400 });

    const [player] = await db.insert(players).values({
      roomId: room.id,
      name,
      isHost: false,
    }).returning();

    return NextResponse.json({ room, player });
  } catch (error: any) {
    console.error("JOIN ROOM ERROR:", error);
    return NextResponse.json({ 
      error: "Failed to join room",
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}
