import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { getAllWhitelisted, addToWhitelist, removeFromWhitelist } from "@/lib/db";

async function isAdmin() {
  const session = await getServerSession(getAuthOptions());
  return (session?.user as any)?.role === "admin";
}

export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getAllWhitelisted());
}

export async function POST(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { steamId, name, role, days } = await request.json();
    if (!steamId) return NextResponse.json({ error: "SteamID is required" }, { status: 400 });

    addToWhitelist(steamId, name || "User", role || "user", days || 0);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const steamId = searchParams.get("steamId");

  if (!steamId) return NextResponse.json({ error: "SteamID is required" }, { status: 400 });

  removeFromWhitelist(steamId);
  return NextResponse.json({ success: true });
}
