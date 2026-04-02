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

    // Request camera subscription frame via rustplus.js
    // rustplus.js supports getCameraFrame via sendRequest with cameraSubscribe
    const response: any = await rustPlusManager.sendRequest(
      session.user.steamId,
      server.ip,
      {
        cameraSubscribe: {
          cameraId: identifier
        }
      }
    );

    if (response?.response?.error) {
      return NextResponse.json({ error: response.response.error.error || "Camera not found" }, { status: 404 });
    }

    // Camera frame data comes back as a buffer in response
    const cameraInfo = response?.response?.cameraSubscribeInfo;
    if (!cameraInfo) {
      return NextResponse.json({ 
        error: `Camera ID "${identifier}" not found on this server. Make sure the camera is placed and has this exact ID.` 
      }, { status: 404 });
    }

    return NextResponse.json({
      identifier,
      width: cameraInfo.width,
      height: cameraInfo.height,
      nearPlane: cameraInfo.nearPlane,
      farPlane: cameraInfo.farPlane,
      controlFlags: cameraInfo.controlFlags,
      // Frame data if available
      frameBase64: cameraInfo.cameraFrame 
        ? Buffer.from(cameraInfo.cameraFrame).toString("base64")
        : null
    });
  } catch (error: any) {
    console.error("[API Camera] Error:", error?.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
