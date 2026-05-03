import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { linkDiscordId } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions(req));
  
  if (!session || !(session.user as any).steamId) {
    return NextResponse.json({ error: "Unauthorized. Must be logged in with Steam." }, { status: 401 });
  }

  try {
    const { discordId } = await req.json();
    if (!discordId) return NextResponse.json({ error: "Missing discordId" }, { status: 400 });

    linkDiscordId((session.user as any).steamId, discordId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
