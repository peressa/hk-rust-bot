import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db, { getTeamChat, saveTeamMessage } from "@/lib/db";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  if (!session?.user?.steamId || !serverId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = getTeamChat(serverId, 50);
    
    // Transformar al formato esperado por CommsModule
    const formatted = messages.map((m: any) => ({
      id: m.id,
      sender: m.name,
      text: m.message,
      timestamp: m.timestamp,
      steamId: m.steamId
    }));

    return NextResponse.json({ messages: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const body = await request.json();
  const { serverId, message } = body;

  if (!session?.user?.steamId || !serverId || !message) {
    return NextResponse.json({ error: "Unauthorized or missing fields" }, { status: 401 });
  }

  try {
    const server = db.prepare("SELECT * FROM servers WHERE id = ? AND steamId = ?").get(serverId, session.user.steamId) as any;
    if (!server) throw new Error("Server not found");

    const response = await rustPlusManager.sendTeamMessage(session.user.steamId, server.ip, message);
    
    // Guardar también localmente para feedback inmediato
    const myMsg = {
        steamId: session.user.steamId,
        name: "Tu",
        message: message,
        time: Date.now()
    };
    saveTeamMessage(serverId, myMsg);

    return NextResponse.json({ success: true, response });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
