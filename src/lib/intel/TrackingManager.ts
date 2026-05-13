import db, { getTrackingTargets, updateTrackingStatus, getServers } from "../db";
import { BattleMetricsManager } from "./BattleMetricsManager";
import { rustPlusManager } from "../rustplus/RustPlusManager";
import { DiscordManager } from "../discord/DiscordManager";

export class TrackingManager {
  private static interval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static async init() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[Tracking Manager] Iniciando servicio de trackeo de objetivos...");

    // Ejecutar cada 2 minutos para no saturar la API de BattleMetrics
    this.interval = setInterval(() => this.checkAllTargets(), 120000);
    
    // Ejecutar una vez al inicio
    setImmediate(() => this.checkAllTargets());
  }

  static async checkAllTargets() {
    try {
      // Obtenemos todos los servidores que tienen un bmId configurado
      const allServers = db.prepare("SELECT * FROM servers WHERE bmId IS NOT NULL").all() as any[];
      
      for (const server of allServers) {
        const targets = getTrackingTargets(server.id);
        if (targets.length === 0) continue;

        console.log(`[Tracking Manager] Verificando ${targets.length} objetivos en ${server.name} (${server.bmId})`);

        for (const target of targets) {
          const status = await BattleMetricsManager.getPlayerStatus(server.bmId, target.steamId);
          
          if (status) {
            const wasOnline = target.isOnline === 1;
            const isOnline = status.isOnline;

            if (wasOnline !== isOnline) {
              await this.handleStatusChange(server, target, isOnline);
            }
          }
        }
      }
    } catch (err) {
      console.error("[Tracking Manager] Error en el ciclo de trackeo:", err);
    }
  }

  private static async handleStatusChange(server: any, target: any, isOnline: boolean) {
    const statusStr = isOnline ? "CONECTADO" : "DESCONECTADO";
    const emoji = isOnline ? "🎯" : "💤";
    const message = `[TRACKEO] El objetivo ${target.name} (${target.steamId}) se ha ${statusStr}.`;

    console.log(`[Tracking Manager] Cambio de estado detectado: ${target.name} -> ${statusStr}`);

    // 1. Actualizar DB
    updateTrackingStatus(server.id, target.steamId, isOnline);

    // 2. Notificar vía Team Chat (si está conectado Rust+)
    try {
      if (rustPlusManager.isConnected(server.steamId, server.ip)) {
        const formatted = rustPlusManager.formatMsg(server.steamId, server.ip, 'track_alert', `${emoji} OBJETIVO ${statusStr}: {name}`, { name: target.name });
        await rustPlusManager.botSendTeamMessage(server.steamId, server.ip, formatted);
      }
    } catch (e) {
      console.warn("[Tracking Manager] No se pudo enviar mensaje al Team Chat:", e);
    }

    // 3. Notificar vía Discord
    if (server.discordWebhook || server.discordChannelId) {
      try {
        await DiscordManager.sendPresence(
          { webhookUrl: server.discordWebhook, channelId: server.discordChannelId },
          target.name,
          target.steamId,
          isOnline,
          server.name
        );
      } catch (e) {
        console.warn("[Tracking Manager] No se pudo enviar mensaje a Discord:", e);
      }
    }
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }
}
