import { db } from "@/db";
import { rooms, players } from "@/db/schema";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const code = nanoid(6).toUpperCase();
    
    const [room] = await db.insert(rooms).values({
      code,
      status: "lobby",
    }).returning();

    const [player] = await db.insert(players).values({
      roomId: room.id,
      name,
      isHost: true,
    }).returning();

    return NextResponse.json({ room, player });
  } catch (error: any) {
    console.error("CREATE ROOM ERROR:", error);
    return NextResponse.json({ 
      error: "Failed to create room", 
      details: error.message,
      code: error.code // PG error code
    }, { status: 500 });
  }
}
