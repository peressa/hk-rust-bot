import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db from "@/lib/db";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");
  const identifier = searchParams.get("identifier");
  const frameIndex = parseInt(searchParams.get("frameIndex") || "0");

  if (!session?.user?.steamId || !serverId || !identifier) {
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

    const response = await rustPlusManager.getCameraFrame(session.user.steamId, server.ip, identifier, frameIndex);
    
    if (response?.response?.cameraFrame?.jpgImage) {
      const buffer = Buffer.from(response.response.cameraFrame.jpgImage);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=1" 
        }
      });
    } else {
      return NextResponse.json({ error: "No image received" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[API Camera] Error:", error.message || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
