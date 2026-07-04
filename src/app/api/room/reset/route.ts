import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { roomId } = await req.json();
    
    await db.update(rooms).set({
      status: "lobby",
      character: null,
      spyId: null,
      startTime: null,
    }).where(eq(rooms.id, roomId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to reset room" }, { status: 500 });
  }
}
