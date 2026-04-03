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

    const history = rustPlusManager.getChatHistory(session.user.steamId, server.ip);
    return NextResponse.json(history);
  } catch (error: any) {
    console.warn(`[API Chat GET] Fallback for ${serverId}`);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const body = await request.json();
  const { serverId, message } = body;

  if (!session?.user?.steamId || !serverId || !message) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
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

    await rustPlusManager.sendTeamMessage(session.user.steamId, server.ip, message);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.warn("[API Chat POST] Error silent handling:", error.message || error);
    // Return 200 with success: false to avoid RED console error while giving enough info to the UI
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Timeout al enviar mensaje"
    }, { status: 200 });
  }
}
