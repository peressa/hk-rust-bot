import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db from "@/lib/db";

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
    
    // For simplicity in this mockup/v1, we assume if they have keys, they can be listening.
    // In a full implementation, we'd check an active process/connection registry.
    return NextResponse.json({
      hasKeys: !!row,
      listening: !!row, // Placeholder for actual listener status
    });
  } catch (error) {
    console.error("[API FCM Status] Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
