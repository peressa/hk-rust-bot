import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { getVendings } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(getAuthOptions(req));
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("serverId");

  if (!serverId) {
    return NextResponse.json({ error: "Missing serverId" }, { status: 400 });
  }

  try {
    const vendings = getVendings(serverId);
    return NextResponse.json(vendings);
  } catch (err) {
    console.error("[API Vendings] Error:", err);
    return NextResponse.json({ error: "Failed to fetch vendings" }, { status: 500 });
  }
}
