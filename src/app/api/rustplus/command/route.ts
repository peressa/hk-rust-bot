import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";
import db from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { serverId, entityId, value } = await request.json();

  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get server details from DB
  const stmt = db.prepare("SELECT * FROM servers WHERE id = ? AND steamId = ?");
  const server: any = stmt.get(serverId, session.user.steamId);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  try {
    // Ensure we are connected
    await rustPlusManager.connect(session.user.steamId, {
      ip: server.ip,
      port: server.port,
      playerId: server.playerId,
      playerToken: server.playerToken
    });

    // Send command
    const response = await rustPlusManager.sendRequest(session.user.steamId, server.ip, {
      entityId: entityId,
      setEntityValue: {
        value: value
      }
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[API Command] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
