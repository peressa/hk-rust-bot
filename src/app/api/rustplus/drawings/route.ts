import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  if (!serverId) {
    return NextResponse.json({ error: "Missing serverId" }, { status: 400 });
  }

  try {
    const drawings = db.prepare("SELECT * FROM map_drawings WHERE serverId = ? ORDER BY createdAt ASC").all(serverId);
    return NextResponse.json(drawings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(getAuthOptions());
  
  // Nota: También permitiremos posters externos si tienen el token de invitado (implementar luego)
  // Por ahora, solo usuarios autenticados.
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { serverId, data, color, id } = body;

    if (!serverId || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const drawingId = id || uuidv4();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO map_drawings (id, serverId, steamId, data, color, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(drawingId, serverId, session.user.steamId, JSON.stringify(data), color || "#fff", new Date().toISOString());

    return NextResponse.json({ success: true, id: drawingId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const serverId = searchParams.get("serverId");

    if (!id && !serverId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    try {
        if (serverId) {
            // Borrar todo el mapa (limpiar)
            db.prepare("DELETE FROM map_drawings WHERE serverId = ?").run(serverId);
        } else {
            db.prepare("DELETE FROM map_drawings WHERE id = ?").run(id);
        }
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
