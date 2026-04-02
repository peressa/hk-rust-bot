import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db from "@/lib/db";

export async function GET() {
  const session = await getServerSession(getAuthOptions());

  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const servers = db.prepare("SELECT * FROM servers WHERE steamId = ?").all(session.user.steamId);
    const entities = db.prepare("SELECT * FROM entities WHERE steamId = ?").all(session.user.steamId);
    const fcmKeys = db.prepare("SELECT steamId FROM fcm_keys WHERE steamId = ?").all(session.user.steamId);

    return NextResponse.json({
      steamId: session.user.steamId,
      serversCount: servers.length,
      entitiesCount: entities.length,
      hasFcmKeys: fcmKeys.length > 0,
      servers,
      entities
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
