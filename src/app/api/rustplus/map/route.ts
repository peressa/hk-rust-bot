import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";
import db from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!serverId) {
    return NextResponse.json({ error: "Missing serverId" }, { status: 400 });
  }

  // Get server details from DB
  const stmt = db.prepare("SELECT * FROM servers WHERE id = ? AND steamId = ?");
  const server: any = stmt.get(serverId, session.user.steamId);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  try {
    // Ensure connected
    await rustPlusManager.connect(session.user.steamId, {
      ip: server.ip,
      port: server.port,
      playerId: server.playerId,
      playerToken: server.playerToken
    });

    // Fetch map and markers in parallel
    const [mapResponse, markersResponse]: any = await Promise.all([
      rustPlusManager.getMap(session.user.steamId, server.ip),
      rustPlusManager.getMapMarkers(session.user.steamId, server.ip)
    ]);

    return NextResponse.json({
      map: mapResponse.response.map,
      markers: markersResponse.response.mapMarkers.markers
    });
  } catch (error: any) {
    console.error("[API Map] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
