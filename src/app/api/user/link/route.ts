import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { linkDiscordId } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions(req));
  
  console.log("[API Link] Intento de vinculación recibido.");
  
  if (!session || !(session.user as any).steamId) {
    console.warn("[API Link] Error: No hay sesión activa o falta SteamID.", { session: !!session });
    return NextResponse.json({ error: "Unauthorized. Must be logged in with Steam." }, { status: 401 });
  }

  const steamId = (session.user as any).steamId;

  try {
    const { discordId } = await req.json();
    if (!discordId) {
      console.warn("[API Link] Error: No se recibió discordId en el body.");
      return NextResponse.json({ error: "Missing discordId" }, { status: 400 });
    }

    console.log(`[API Link] Vinculando Steam:${steamId} con Discord:${discordId}`);
    const success = linkDiscordId(steamId, discordId);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      console.error("[API Link] La función linkDiscordId devolvió falso.");
      return NextResponse.json({ error: "DB Update failed" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[API Link] Error interno:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
