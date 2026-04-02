import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db from "@/lib/db";
import { listenerRegistry } from "@/lib/fcm/ListenerRegistry";

export async function POST() {
  const session = await getServerSession(getAuthOptions());
  
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steamId = session.user.steamId;

  try {
    // 1. Kill active listener
    listenerRegistry.removeListener(steamId);

    // 2. Clear DB keys
    const stmt = db.prepare("DELETE FROM fcm_keys WHERE steamId = ?");
    stmt.run(steamId);

    console.log(`[API FCM] User ${steamId} unregistered and cleared.`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API FCM Unregister] Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
