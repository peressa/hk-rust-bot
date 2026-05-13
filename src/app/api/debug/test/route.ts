import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth/authOptions";
import { rustPlusManager } from "@/lib/rustplus/RustPlusManager";
import { DiscordManager } from "@/lib/discord/DiscordManager";
import db from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(getAuthOptions());
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const serverId = searchParams.get("serverId");

  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const server = db.prepare("SELECT * FROM servers WHERE id = ?").get(serverId) as any;
  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

  try {
    switch (type) {
      case "discord":
        await DiscordManager.sendGenericAlert(
          { webhookUrl: server.discordWebhook, channelId: server.discordChannelId },
          "🧪 TEST DE DISCORD",
          "Esta es una notificación de prueba desde el sistema táctico."
        );
        return NextResponse.json({ success: true, message: "Alerta de Discord enviada" });

      case "rust":
        if (rustPlusManager.isConnected(server.steamId, server.ip)) {
          const msg = rustPlusManager.formatMsg(server.steamId, server.ip, 'test', "🧪 TEST DE RUST+: El sistema de comunicación está operativo.");
          await rustPlusManager.botSendTeamMessage(server.steamId, server.ip, msg);
          return NextResponse.json({ success: true, message: "Mensaje de Rust+ enviado" });
        }
        return NextResponse.json({ error: "Rust+ no está conectado para este servidor" }, { status: 400 });

      case "ban":
        if (rustPlusManager.isConnected(server.steamId, server.ip)) {
           const msg = rustPlusManager.formatMsg(server.steamId, server.ip, 'ban_alert', `🚨 BAN: {name} ({steamId}) ha sido baneado. Tipo: {type}`, { 
             name: "TEST_PLAYER", 
             steamId: "76561100000000000",
             type: "TEST_BAN" 
           });
           await rustPlusManager.botSendTeamMessage(server.steamId, server.ip, msg);
           
           if (server.discordWebhook || server.discordChannelId) {
             await DiscordManager.sendGenericAlert(
                { webhookUrl: server.discordWebhook, channelId: server.discordChannelId },
                "Baneo de Prueba",
                "Esto es un simulacro de baneo para verificar los reportes."
             );
           }
           return NextResponse.json({ success: true, message: "Simulacro de baneo enviado" });
        }
        return NextResponse.json({ error: "Rust+ no está conectado" }, { status: 400 });

      default:
        return NextResponse.json({ error: "Tipo de test inválido (discord, rust, ban)" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
