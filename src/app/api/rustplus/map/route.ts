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

    await rustPlusManager.connect(session.user.steamId, {
      ip: server.ip,
      port: server.port,
      playerId: server.playerId,
      playerToken: server.playerToken,
      useProxy: server.useProxy === 1
    });

    console.log(`[API Map] Requesting map from RustPlusManager for ${server.ip}...`);
    const startTime = Date.now();
    const mapResponse = await rustPlusManager.getMap(session.user.steamId, server.ip);
    const endTime = Date.now();
    console.log(`[API Map] Response received in ${endTime - startTime}ms`);

    const map = (mapResponse as any)?.response?.map;
    
    if (!map || !map.jpgImage) {
      throw new Error("No se pudo obtener la imagen del mapa");
    }

    // Convert Buffer to Base64 string for the frontend
    const base64Map = Buffer.from(map.jpgImage).toString('base64');
    console.log(`[API Map] Success: Base64 converted, size: ${base64Map.length} chars`);

    return NextResponse.json({
      ...map,
      jpgImage: base64Map
    });
  } catch (error: any) {
    console.error("[API Map] Error:", error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
