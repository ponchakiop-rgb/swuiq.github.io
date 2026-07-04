import { db } from "@/db";
import { rooms, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code: rawCode } = await params;
    const code = rawCode.toUpperCase();
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const roomPlayers = await db.select().from(players).where(eq(players.roomId, room.id));

    return NextResponse.json({ room, players: roomPlayers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch room state" }, { status: 500 });
  }
}
