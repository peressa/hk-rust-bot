import { NextResponse } from "next/server";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";
import { listenerRegistry } from "@/lib/fcm/ListenerRegistry";

export async function GET() {
  const activeServers = Array.from((rustPlusManager as any).connections.keys());
  const activeFcm = listenerRegistry.getActiveSteamIds();
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    manager: {
      activeConnections: activeServers,
      readyStatus: Array.from((rustPlusManager as any).ready.entries())
    },
    fcm: {
      activeListeners: activeFcm
    },
    auth: {
      adminConfigured: process.env.ADMIN_STEAM_ID ? "YES" : "NO",
      adminIdPrefix: process.env.ADMIN_STEAM_ID ? process.env.ADMIN_STEAM_ID.substring(0, 4) + "..." : "NONE",
      fallbackActive: !process.env.ADMIN_STEAM_ID,
      availableKeys: Object.keys(process.env).filter(key => key.includes('STEAM') || key.includes('ADMIN') || key.includes('NEXTAUTH'))
    }
  });
}
