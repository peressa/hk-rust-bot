import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db from "@/lib/db";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  if (!session?.user?.steamId || !serverId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const server = db.prepare("SELECT * FROM servers WHERE id = ? AND steamId = ?").get(serverId, session.user.steamId) as any;
    if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

    const client = await rustPlusManager.connect(session.user.steamId, {
      ip: server.ip,
      port: server.port,
      playerId: server.playerId,
      playerToken: server.playerToken,
      useProxy: server.useProxy === 1
    });

    const markersData = await rustPlusManager.getMapMarkers(session.user.steamId, server.ip).catch(() => ({}));
    const teamData = await rustPlusManager.getTeamInfo(session.user.steamId, server.ip).catch(() => ({}));

    return NextResponse.json({
      markers: (markersData as any)?.response?.mapMarkers?.markers || [],
      team: (teamData as any)?.response?.teamInfo?.members || []
    });
  } catch (error: any) {
    console.warn("[API Markers] Silent Fallback (200 OK with empty lists):", error.message || error);
    // Return empty results instead of 500 to keep Frontend alive during reconnections
    return NextResponse.json({ 
      markers: [], 
      team: [], 
      status: "reconnecting" 
    }, { status: 200 });
  }
}
