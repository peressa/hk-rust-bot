import { NextResponse } from "next/server";
import { SteamQueryManager } from "@/lib/intel/SteamQueryManager";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const server = searchParams.get("server"); // IP:Port

  if (!server) {
    return NextResponse.json({ error: "Falta el parámetro 'server' (IP:Port)" }, { status: 400 });
  }

  try {
    const [ip, portStr] = server.split(":");
    const gamePort = parseInt(portStr || "28015");
    
    // Por defecto en Rust, el Query Port es Game Port + 1
    // Algunos hostings usan puertos específicos, pero +1 es el estándar.
    const queryPort = gamePort + 1;

    console.log(`[Query API] Consultando servidor ${ip}:${queryPort} (Direct Query)`);
    const players = await SteamQueryManager.getPlayers(ip, queryPort);
    
    return NextResponse.json({
      server: { ip, gamePort, queryPort },
      playerCount: players.length,
      players: players.sort((a, b) => b.duration - a.duration) // Ordenar por tiempo de conexión
    });
  } catch (error: any) {
    console.error("[Query API] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
