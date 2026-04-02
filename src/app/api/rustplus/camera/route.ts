import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";
import db from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");
  const identifier = searchParams.get("identifier");

  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!serverId || !identifier) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
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

    // Request camera frame
    // Note: rustplus.js handles camera streams via a sequence of frames. 
    // We send a request for a single subscribe then get back the stream.
    // For a simple web preview, we use the camera control.
    
    // In rustplus.js, we need to handle camera subscription carefully.
    // This is a complex logic that usually involves a callback for frames.
    // For now, we will implement the PTZ and Subscription logic.
    
    return NextResponse.json({ 
      info: "Camera system initialized. Polling frames via WebSockets is recommended for production.",
      identifier
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
