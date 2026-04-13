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

  const stmt = db.prepare("SELECT * FROM servers WHERE id = ? AND steamId = ?");
  const server: any = stmt.get(serverId, session.user.steamId);

  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

  try {
    const steamId = session.user.steamId;
    const ip = server.ip;

    // Conectar si no lo está (esto es idempotente)
    await rustPlusManager.connect(steamId, {
      ip: server.ip,
      port: server.port,
      playerId: server.playerId,
      playerToken: server.playerToken,
      useProxy: server.useProxy === 1
    });

    // Obtener datos agregados
    const [teamResp, markersResp] = await Promise.all([
      rustPlusManager.getTeamInfo(steamId, ip).catch(() => ({ response: { teamInfo: { members: [] } } })),
      rustPlusManager.getMapMarkers(steamId, ip).catch(() => ({ response: { mapMarkers: { markers: [] } } }))
    ]);

    const intelLog = rustPlusManager.getIntelLog(steamId, ip);

    return NextResponse.json({
      team: teamResp.response?.teamInfo?.members || [],
      markers: markersResp.response?.mapMarkers?.markers || [],
      intelLog: intelLog
    });

  } catch (error: any) {
    console.error(`[API Intel] Error for ${server.ip}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
