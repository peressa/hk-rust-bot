import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { FcmManager } from "@/lib/fcm/FcmManager";

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { authToken } = await request.json();

  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!authToken) {
    return NextResponse.json({ error: "Auth Token is required" }, { status: 400 });
  }

  try {
    const result = await FcmManager.register(session.user.steamId, authToken);
    
    // Start listening immediately after registration
    FcmManager.listen(session.user.steamId, (data) => {
      console.log(`[FCM API] Live notification for newly registered user ${session.user.steamId}`);
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("[API FCM Register] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to register with Facepunch" }, { status: 500 });
  }
}
