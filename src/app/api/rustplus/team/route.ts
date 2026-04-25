import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db, { saveDeathMarker } from "@/lib/db";
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

    await rustPlusManager.connect(session.user.steamId, {
      ip: server.ip,
      port: server.port,
      playerId: server.playerId,
      playerToken: server.playerToken,
      useProxy: server.useProxy === 1
    });

    const teamData = await rustPlusManager.getTeamInfo(session.user.steamId, server.ip).catch(() => ({}));
    const teamInfo = (teamData as any)?.response?.teamInfo || { members: [] };

    // Grabar muertes
    teamInfo.members.forEach((m: any) => {
       if (m.isAlive === false && m.x !== undefined && m.y !== undefined) {
         const isNew = saveDeathMarker(String(m.steamId), serverId, m.name, m.x, m.y);
         if (isNew && server.discordWebhook) {
            import("@/lib/discord/DiscordManager").then(({ DiscordManager }) => {
               DiscordManager.sendDeath(server.discordWebhook, m.name, m.x, m.y, server.name);
            });
         }
       }
    });

    const history = rustPlusManager.getPlayerHistory(session.user.steamId, server.ip);

    return NextResponse.json({
      ...teamInfo,
      history
    });
  } catch (error: any) {
    console.warn("[API Team] Silent Fallback");
    return NextResponse.json({ members: [], history: {} }, { status: 200 });
  }
}
