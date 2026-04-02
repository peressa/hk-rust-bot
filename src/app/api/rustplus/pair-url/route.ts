import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { saveServer } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    if (!url || !url.startsWith("rustplus://")) {
      return NextResponse.json({ error: "Invalid Rust+ URL" }, { status: 400 });
    }

    // Example: rustplus://paper?ip=177.221.141.139&port=28085&playerId=765611980&playerToken=-1623808788&name=[LTG]...
    const urlObj = new URL(url.replace("rustplus://", "http://"));
    const searchParams = urlObj.searchParams;

    const ip = searchParams.get("ip") || searchParams.get("host");
    const port = searchParams.get("port") || "28082";
    const playerId = searchParams.get("playerId") || searchParams.get("playerid");
    const playerToken = searchParams.get("playerToken") || searchParams.get("playertoken");
    const name = searchParams.get("name") || "Servidor Manual";

    if (!ip || !playerId || !playerToken) {
      return NextResponse.json({ error: "Enlace incompleto (Faltan parámetros)" }, { status: 400 });
    }

    const server = {
      ip,
      port,
      playerId,
      playerToken,
      name,
      steamId: session.user.steamId
    };

    saveServer(server);

    return NextResponse.json({ success: true, server });
  } catch (error: any) {
    console.error("[API Pair URL] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
