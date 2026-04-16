import { NextResponse } from "next/server";
import { getInvite, getServers } from "@/lib/db";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inviteId, code } = body;

    if (!inviteId || !code) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const invite = getInvite(inviteId) as any;
    if (!invite) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    // 1. Verificar PIN
    if (invite.code !== code) {
      return NextResponse.json({ error: "Código PIN incorrecto" }, { status: 401 });
    }

    // 2. Verificar Wipe (Auto-invalidación)
    // Para esto necesitamos conectarnos un momento al servidor y pedir getInfo
    // Pero como no tenemos el steamId del invitante aquí directamente de la sesión, 
    // lo sacamos del invite (ah, no lo guardé, pero puedo sacarlo de la tabla servers si busco por serverId)
    // UPDATE: En db.ts el invite tiene el serverId.
    
    // Necesitamos un "dueño" para conectar. Sacaremos el primer servidor que coincida.
    // O mejor, guardé el steamId en war_room_invites? No, pero puedo buscar en la tabla servers por id.
    
    // Simplificación: Buscamos en la DB de servers por ese serverId.
    const db = require("@/lib/db").default;
    const server = db.prepare("SELECT * FROM servers WHERE id = ?").get(invite.serverId) as any;
    
    if (server) {
        try {
            const info = await rustPlusManager.sendRequest(server.steamId, server.ip, { getInfo: {} });
            const currentWipe = info?.response?.info?.wipeTime || 0;
            
            if (invite.targetWipeTime > 0 && currentWipe > invite.targetWipeTime) {
                return NextResponse.json({ error: "Este link ha expirado debido a un Wipe del servidor." }, { status: 410 });
            }
        } catch(e) {
            console.warn("No se pudo verificar wipe, permitiendo acceso por fallo de red.");
        }
    }

    return NextResponse.json({ 
        success: true, 
        serverId: invite.serverId,
        canDraw: invite.canDraw === 1
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
