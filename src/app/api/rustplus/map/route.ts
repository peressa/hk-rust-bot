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
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const server = db.prepare("SELECT * FROM servers WHERE id = ? AND steamId = ?").get(serverId, session.user.steamId) as any;
    if (!server) return NextResponse.json({ error: "Servidor no encontrado" }, { status: 404 });

    console.log(`[API Map] Iniciando conexión para ${server.ip}...`);
    await rustPlusManager.connect(session.user.steamId, {
      ip: server.ip,
      port: server.port,
      playerId: server.playerId,
      playerToken: server.playerToken,
      useProxy: server.useProxy === 1
    });

    console.log(`[API Map] Solicitando mapa a RustPlusManager...`);
    const startTime = Date.now();
    const mapResponse = await rustPlusManager.getMap(session.user.steamId, server.ip);
    const endTime = Date.now();
    
    const map = mapResponse?.response?.map;
    if (!map || !map.jpgImage) {
      console.error("[API Map] Error: La respuesta no contiene imagen JPG válida.");
      throw new Error("No se pudo obtener la imagen del mapa. El servidor de Rust no respondió con datos válidos.");
    }

    // El buffer puede venir como Uint8Array o Buffer directo
    const imageBuffer = Buffer.isBuffer(map.jpgImage) 
      ? map.jpgImage 
      : Buffer.from(map.jpgImage);

    const base64Map = imageBuffer.toString('base64');
    console.log(`[API Map] Éxito en ${endTime - startTime}ms. Tamaño Base64: ${base64Map.length} chars`);

    return NextResponse.json({
      ...map,
      jpgImage: base64Map,
      fetchedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.warn("[API Map] Error Detectado:", error.message || error);
    
    // Devolvemos 200 con el error para que el frontend maneje el estado visualmente
    return NextResponse.json({ 
      error: error.message || "Error desconocido al cargar el mapa",
      status: "error",
      details: error.stack
    }, { status: 200 });
  }
}
