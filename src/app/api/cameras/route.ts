import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { getCameras, saveCamera, deleteCamera } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  if (!session?.user?.steamId || !serverId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cameras = getCameras(session.user.steamId, serverId);
    return NextResponse.json(cameras);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { serverId, identifier, name } = body;
    
    if (!serverId || !identifier) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    saveCamera(session.user.steamId, serverId, identifier, name || identifier);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const cameraId = searchParams.get("id");

  if (!session?.user?.steamId || !cameraId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    deleteCamera(cameraId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
