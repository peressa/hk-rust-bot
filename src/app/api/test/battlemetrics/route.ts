import { NextResponse } from "next/server";
import { BattleMetricsManager } from "@/lib/intel/BattleMetricsManager";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type") || "player"; // player or server

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    let data;
    if (type === "server") {
      // Intentar buscar por IP
      data = await BattleMetricsManager.getServerByIP(q);
    } else {
      // Buscar por nombre de jugador
      data = await BattleMetricsManager.searchPlayer(q);
    }

    if (!data) return NextResponse.json({ error: "No results found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
