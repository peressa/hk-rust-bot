import { NextResponse } from "next/server";
import { getTrackedPlayers } from "@/lib/db";

export async function GET() {
  try {
    const players = getTrackedPlayers();
    return NextResponse.json(players);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
