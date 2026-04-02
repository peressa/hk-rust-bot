import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { FcmManager } from "@/lib/fcm/FcmManager";

export async function POST() {
  const session = await getServerSession(getAuthOptions());
  
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Start listener in background
    // Note: In Next.js App Router, these processes might be killed if not careful.
    // Ideally, use a singleton or a dedicated background worker.
    FcmManager.listen(session.user.steamId, (data) => {
      console.log(`[FCM API] Received live notification for ${session.user.steamId}`);
    });

    return NextResponse.json({ status: "Listening..." });
  } catch (error: any) {
    console.error("[API FCM Start] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
