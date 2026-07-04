import { db } from "@/db";
import { rooms, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { DEADLOCK_CHARACTERS } from "@/constants";

export async function POST(req: Request) {
  try {
    const { roomId, playerId } = await req.json();
    
    // Verify host
    const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    if (!player || !player.isHost) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const roomPlayers = await db.select().from(players).where(eq(players.roomId, roomId));
    if (roomPlayers.length < 3) return NextResponse.json({ error: "Need at least 3 players" }, { status: 400 });

    const randomChar = DEADLOCK_CHARACTERS[Math.floor(Math.random() * DEADLOCK_CHARACTERS.length)];
    const spyPlayer = roomPlayers[Math.floor(Math.random() * roomPlayers.length)];

    await db.update(rooms).set({
      status: "playing",
      character: randomChar,
      spyId: spyPlayer.id,
      startTime: new Date(),
    }).where(eq(rooms.id, roomId));

    await db.update(players).set({ isSpy: false }).where(eq(players.roomId, roomId));
    await db.update(players).set({ isSpy: true }).where(eq(players.id, spyPlayer.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
  }
}
