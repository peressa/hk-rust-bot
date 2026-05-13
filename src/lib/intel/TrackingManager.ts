import { BattleMetricsManager } from "./BattleMetricsManager";
import { SteamQueryManager } from "./SteamQueryManager";
import db, { getTrackedPlayers, updatePlayerStatus, getServers } from "../db";
import { DiscordManager } from "../discord/DiscordManager";
import { rustPlusManager } from "../rustplus/RustPlusManager";

export class TrackingManager {
  private static interval: NodeJS.Timeout | null = null;

  /**
   * Inicia el ciclo de monitoreo de jugadores seguidos.
   */
  static async init(intervalMs: number = 60000) { // Reducido a 1 minuto para mayor precisión
    if (this.interval) return;

    console.log("[TrackingManager] Iniciando motor de vigilancia táctica (1m)...");
    
    // Ejecución inmediata inicial
    this.checkTrackedPlayers();
    
    this.interval = setInterval(() => {
      this.checkTrackedPlayers();
    }, intervalMs);
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Verifica el estado de los jugadores seguidos usando BM o Query Directo según sea el caso.
   */
  private static async checkTrackedPlayers() {
    const tracked = getTrackedPlayers();
    if (tracked.length === 0) return;

    console.log(`[TrackingManager] Escaneando objetivos (${tracked.length})...`);

    for (const player of tracked) {
      try {
        let isOnline = false;
        let serverName = player.lastServerName || "Servidor Desconocido";
        let serverId = player.lastServerId;

        // MODO HORUS: Si tiene IP de servidor objetivo, consultamos directamente
        if (player.targetServerIp) {
            const [ip, portStr] = player.targetServerIp.split(":");
            const queryPort = parseInt(portStr || "28015") + 1;
            
            console.log(`[TrackingManager] Query Directo: Buscando a ${player.name} en ${ip}:${queryPort}`);
            isOnline = await SteamQueryManager.isPlayerOnline(ip, queryPort, player.name);
            serverName = player.targetServerIp;
        } 
        // MODO BATTLEMETRICS: Si no hay IP, usamos la API (si el ID es de BM)
        else if (player.id && !player.id.startsWith('direct-')) {
            const sessions = await BattleMetricsManager.getPlayerSessions(player.id);
            const activeSession = sessions.find((s: any) => s.attributes.stop === null);
            isOnline = !!activeSession;
            
            if (activeSession) {
                serverId = activeSession.relationships?.server?.data?.id;
                const sInfo = await BattleMetricsManager.getServerInfo(serverId);
                serverName = sInfo?.data?.attributes?.name || "Servidor Desconocido";
            }
        }

        const newStatus = isOnline ? 'online' : 'offline';

        if (player.status !== newStatus) {
            console.log(`[TrackingManager] CAMBIO: ${player.name} [${player.targetServerIp || 'Global'}] -> ${newStatus}`);
            
            updatePlayerStatus(player.id, newStatus, serverId, serverName);

            const msg = newStatus === 'online' 
                ? `🎯 **OBJETIVO DETECTADO**: **${player.name}** ha entrado a **${serverName}**.`
                : `🌫️ **OBJETIVO PERDIDO**: **${player.name}** se ha desconectado de **${serverName}**.`;

            this.notifyDiscord(msg);
            
            // Notificar también en Team Chat si el objetivo es del servidor actual
            try {
                const teamMsg = newStatus === 'online'
                    ? `🎯 OBJETIVO DETECTADO: ${player.name} ha entrado.`
                    : `🌫️ OBJETIVO PERDIDO: ${player.name} se ha desconectado.`;
                
                const servers = getServers();
                for (const s of servers) {
                    if (s.ip && rustPlusManager.isConnected(s.steamId, s.ip)) {
                        // Solo enviar si el objetivo está en ESTE servidor o es rastreo global
                        if (!player.targetServerIp || player.targetServerIp.includes(s.ip)) {
                            rustPlusManager.botSendTeamMessage(s.steamId, s.ip, rustPlusManager.formatMsg(s.steamId, s.ip, '', teamMsg));
                        }
                    }
                }
            } catch (e) {
                console.error("[TrackingManager] Error notificando al equipo:", e);
            }
        }
      } catch (err) {
        console.error(`[TrackingManager] Error en ${player.name}:`, err);
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  private static notifyDiscord(message: string) {
    try {
        const servers = db.prepare("SELECT * FROM servers WHERE discordWebhook IS NOT NULL OR discordChannelId IS NOT NULL").all() as any[];
        for (const s of servers) {
            DiscordManager.sendGenericAlert(s, "Inteligencia Táctica", message);
        }
    } catch (e) {}
  }
}
