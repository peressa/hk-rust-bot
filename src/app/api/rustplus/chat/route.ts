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
    await rustPlusManager.connect(session.user.steamId, {
      ip: server.ip,
      port: server.port,
      playerId: server.playerId,
      playerToken: server.playerToken
    });

    const info: any = await rustPlusManager.getTeamInfo(session.user.steamId, server.ip);
    return NextResponse.json(info.response.teamInfo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { serverId, message } = await request.json();

  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stmt = db.prepare("SELECT * FROM servers WHERE id = ? AND steamId = ?");
  const server: any = stmt.get(serverId, session.user.steamId);

  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

  try {
    const response = await rustPlusManager.sendTeamMessage(session.user.steamId, server.ip, message);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
