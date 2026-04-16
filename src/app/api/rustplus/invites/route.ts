import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { createInvite, getInvitesByServer, getServers, deleteInvite } from "@/lib/db";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  if (!session?.user?.steamId || !serverId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invites = getInvitesByServer(serverId);
    return NextResponse.json(invites);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const body = await request.json();
  const { serverId, name, expires, canDraw } = body;

  if (!session?.user?.steamId || !serverId || !name) {
    return NextResponse.json({ error: "Unauthorized or missing fields (name required)" }, { status: 401 });
  }

  try {
    const server = getServers(session.user.steamId).find((s: any) => s.id === serverId) as any;
    if (!server) throw new Error("Server not found");

    const info = await rustPlusManager.sendRequest(session.user.steamId, server.ip, { getInfo: {} });
    const currentWipeTime = info?.response?.info?.wipeTime || 0;

    // Generar PIN aleatorio de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    let targetWipeTime = 0;
    let expiresAt = null;

    if (expires === "wipe") {
        targetWipeTime = currentWipeTime;
    } else {
        const now = new Date();
        const duration = expires || "7d";
        const val = parseInt(duration);
        if (duration.endsWith('h')) now.setHours(now.getHours() + val);
        else if (duration.endsWith('d')) now.setDate(now.getDate() + val);
        expiresAt = now.toISOString();
    }

    const id = createInvite(serverId, name, code, targetWipeTime, expiresAt, canDraw || false);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(getAuthOptions());
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!session?.user?.steamId || !id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        deleteInvite(id);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
