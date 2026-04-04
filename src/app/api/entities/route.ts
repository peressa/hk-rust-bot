import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { getEntities } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steamId = session.user.steamId;

  if (!serverId) {
    return NextResponse.json({ error: "Missing serverId" }, { status: 400 });
  }

  try {
    const entities = getEntities(steamId, serverId);
    const sync = searchParams.get("sync") === "true";

    if (sync && entities.length > 0) {
      const dbModule = await import("@/lib/db");
      const { rustPlusManager } = await import("@/lib/rustplus/RustPlusManager");
      
      const server = dbModule.default.prepare("SELECT * FROM servers WHERE id = ?").get(serverId) as any;
      if (server) {
        await rustPlusManager.connect(steamId, server);
        
        const updatedEntities = await Promise.all(entities.map(async (e: any) => {
          try {
            const info = await rustPlusManager.getEntityInfo(steamId, server.ip, e.entityId);
            const payload = info.response?.entityInfo?.payload;
            if (payload) {
               const updated = { ...e, value: payload.value, capacity: payload.capacity, hasCapacity: payload.hasCapacity };
               dbModule.saveEntity(updated);
               return updated;
            }
          } catch (err) { }
          return e;
        }));
        return NextResponse.json(updatedEntities);
      }
    }

    return NextResponse.json(entities);
  } catch (error) {
    console.error("[API Entities] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
