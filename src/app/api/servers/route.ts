import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { getServers } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const servers = getServers(session.user.steamId);
    return NextResponse.json(servers);
  } catch (error) {
    console.error("[API Servers] Error:", error);
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
    const { serverId, discordWebhook, bmId } = body;
    
    // Import db internally or fetch from top
    const dbModule = await import("@/lib/db");
    const db = dbModule.default;
    
    // Verify ownership
    const server = db.prepare("SELECT * FROM servers WHERE id = ? AND steamId = ?").get(serverId, session.user.steamId) as any;
    if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

    // Update
    if (discordWebhook !== undefined) server.discordWebhook = discordWebhook;
    if (bmId !== undefined) server.bmId = bmId;
    
    dbModule.saveServer(server);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Servers POST] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
