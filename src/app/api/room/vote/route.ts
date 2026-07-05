import { db } from "@/db";
import { rooms, players } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { roomId, playerId, targetId } = await req.json();

    await db.update(players).set({ votedFor: targetId }).where(eq(players.id, playerId));

    // Check if anyone has majority
    const allPlayers = await db.select().from(players).where(eq(players.roomId, roomId));
    const votes: Record<number, number> = {};
    allPlayers.forEach(p => {
      if (p.votedFor) votes[p.votedFor] = (votes[p.votedFor] || 0) + 1;
    });

    const majority = Math.floor(allPlayers.length / 2) + 1;
    const votedTargetId = Object.entries(votes).find(([_, count]) => count >= majority)?.[0];

    if (votedTargetId) {
      const targetPlayer = allPlayers.find(p => p.id === Number(votedTargetId));
      await db.update(rooms).set({
        status: "finished",
        winner: targetPlayer?.isSpy ? "citizens" : "spy"
      }).where(eq(rooms.id, roomId));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
