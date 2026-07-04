import { db } from "@/db";
import { rooms, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { roomId, playerId } = await req.json();
    
    // Verify host or allow anyone to end for now for simplicity, 
    // but better check if player exists in room
    const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    if (!player) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await db.update(rooms).set({
      status: "finished",
    }).where(eq(rooms.id, roomId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to end game" }, { status: 500 });
  }
}
