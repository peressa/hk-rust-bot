import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db from "@/lib/db";
import { FcmManager } from "@/lib/fcm/FcmManager";

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steamId = session.user.steamId;

  try {
    // Check if user has keys in DB
    const stmt = db.prepare("SELECT keys FROM fcm_keys WHERE steamId = ?");
    const row = stmt.get(steamId);
    
    const isListening = FcmManager.isListening(steamId);

    return NextResponse.json({
      hasKeys: !!row,
      listening: isListening,
    });
  } catch (error) {
    console.error("[API FCM Status] Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
