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
    console.log("[Tracking Manager] Iniciando servicio de trackeo INTELIGENTE...");

    // Reducimos el intervalo a 45 segundos para mayor rapidez, 
    // pero optimizamos las llamadas a la API.
    this.interval = setInterval(() => this.checkAllTargets(), 45000);
    
    // Ejecutar una vez al inicio
    setImmediate(() => this.checkAllTargets());
  }

  static async checkAllTargets() {
    try {
      const allServers = db.prepare("SELECT * FROM servers WHERE bmId IS NOT NULL").all() as any[];
      
      for (const server of allServers) {
        const targets = getTrackingTargets(server.id);
        if (targets.length === 0) continue;

        // 1. OBTENER LISTA DE JUGADORES ONLINE (UNA SOLA LLAMADA POR SERVIDOR)
        const onlinePlayers = await BattleMetricsManager.getOnlinePlayers(server.bmId);
        const onlineIds = new Set(onlinePlayers.map(p => p.id));

        for (const target of targets) {
          let isOnline = false;
          let bmPlayerId = target.bmPlayerId;

          // 2. SI NO TENEMOS EL BM ID, BUSCAMOS UNA VEZ POR STEAM ID
          if (!bmPlayerId) {
            const status = await BattleMetricsManager.getPlayerStatus(server.bmId, target.steamId);
            if (status?.id) {
              bmPlayerId = status.id;
              isOnline = status.isOnline;
              // Guardamos el BM ID para futuras revisiones ultra-rápidas
              updateTrackingStatus(server.id, target.steamId, isOnline, bmPlayerId);
            }
          } else {
            // 3. REVISIÓN ULTRA-RÁPIDA CONTRA EL SET LOCAL
            isOnline = onlineIds.has(bmPlayerId);
          }

          // 4. DETECCIÓN DE CAMBIO DE ESTADO
          const wasOnline = target.isOnline === 1;
          if (wasOnline !== isOnline) {
             // Verificación de doble factor para evitar falsos negativos en el listado
             if (wasOnline && !isOnline) {
                const confirm = await BattleMetricsManager.getPlayerStatus(server.bmId, target.steamId);
                if (confirm?.isOnline) continue; // Era un falso negativo del listado
             }
             await this.handleStatusChange(server, target, isOnline);
          }
          
          // 5. DETECCIÓN DE BANEOS (Ocasional o tras desconexión sospechosa)
          if (wasOnline && !isOnline) {
             this.checkBanStatus(server, target);
          }
        }
      }
    } catch (err) {
      console.error("[Tracking Manager] Error en el ciclo de trackeo:", err);
    }
  }

  private static async checkBanStatus(server: any, target: any) {
    try {
      // Usamos la búsqueda directa para ver metadatos de baneo
      const res = await fetch(`https://api.battlemetrics.com/players?filter[servers]=${server.bmId}&filter[search]=${target.steamId}`);
      const data = await res.json();
      const player = data.data?.[0];
      
      if (player?.attributes?.isBanned || player?.attributes?.positiveMatch) {
         // Si detectamos baneo reciente
         const msg = `⚠️ ¡ALERTA ROJA! El objetivo ${target.name} ha sido BANEADO del servidor.`;
         this.notifyAlert(server, target, msg, "Baneo Detectado", 0xef4444);
         updateTrackingBan(server.id, target.steamId, true);
      }
    } catch (e) {}
  }

  private static async handleStatusChange(server: any, target: any, isOnline: boolean) {
    const statusStr = isOnline ? "CONECTADO" : "DESCONECTADO";
    const emoji = isOnline ? "🎯" : "💤";
    
    console.log(`[Tracking Manager] Cambio de estado: ${target.name} -> ${statusStr}`);
    updateTrackingStatus(server.id, target.steamId, isOnline);

    const msg = isOnline 
      ? `${emoji} OBJETIVO LOCALIZADO: {name} ha entrado al servidor.`
      : `${emoji} OBJETIVO PERDIDO: {name} ha salido del servidor.`;

    // Notificar Team Chat
    if (rustPlusManager.isConnected(server.steamId, server.ip)) {
       const formatted = rustPlusManager.formatMsg(server.steamId, server.ip, 'track_alert', msg, { name: target.name });
       rustPlusManager.botSendTeamMessage(server.steamId, server.ip, formatted);
    }

    // Notificar Discord
    if (server.discordWebhook || server.discordChannelId) {
      DiscordManager.sendPresence(
        { webhookUrl: server.discordWebhook, channelId: server.discordChannelId },
        target.name,
        target.steamId,
        isOnline,
        server.name
      );
    }
  }

  private static async notifyAlert(server: any, target: any, text: string, title: string, color: number) {
     if (rustPlusManager.isConnected(server.steamId, server.ip)) {
        rustPlusManager.botSendTeamMessage(server.steamId, server.ip, `:warning: ${text}`);
     }
     if (server.discordWebhook || server.discordChannelId) {
        DiscordManager.sendGenericAlert(
          { webhookUrl: server.discordWebhook, channelId: server.discordChannelId },
          title,
          text
        );
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
