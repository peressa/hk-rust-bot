import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { getTrackingTargets, addTrackingTarget, removeTrackingTarget } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  if (!session?.user?.steamId || !serverId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targets = getTrackingTargets(serverId);
  return NextResponse.json(targets);
}

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { serverId, steamId, name } = await request.json();
    if (!serverId || !steamId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    addTrackingTarget(serverId, steamId, name);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");
  const steamId = searchParams.get("steamId");

  if (!session?.user?.steamId || !serverId || !steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  removeTrackingTarget(serverId, steamId);
  return NextResponse.json({ success: true });
}
