import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { BattleMetricsManager } from "@/lib/intel/BattleMetricsManager";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const bmId = searchParams.get("bmId");

  if (!session?.user?.steamId || !bmId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await BattleMetricsManager.getServerInfo(bmId);
    if (!data) return NextResponse.json({ error: "No data found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
