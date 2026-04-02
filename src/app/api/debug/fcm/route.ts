import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { FcmManager } from "@/lib/fcm/FcmManager";

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return the last 20 raw messages captured in RAM
  return NextResponse.json(FcmManager.debugLogs || []);
}
