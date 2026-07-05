import { db } from "@/db";
import { rooms, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { roomId, playerId, guess } = await req.json();

    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);

    if (!room || !player || !player.isSpy) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const isCorrect = guess.toLowerCase().trim() === room.character?.toLowerCase().trim();

    await db.update(rooms).set({
      status: "finished",
      winner: isCorrect ? "spy" : "citizens"
    }).where(eq(rooms.id, roomId));

    return NextResponse.json({ success: true, correct: isCorrect });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
