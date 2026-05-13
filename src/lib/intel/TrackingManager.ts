import { SteamQueryManager } from "./SteamQueryManager";
import { BattleMetricsManager } from "./BattleMetricsManager";
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

        // MODO HÍBRIDO DE VIGILANCIA
        if (player.targetServerIp) {
            const [ip, portStr] = player.targetServerIp.split(":");
            const gamePort = parseInt(portStr || "28015");
            
            // 1. Intentar vía Horus (Directo)
            const ports = [gamePort + 1, gamePort + 215, gamePort, 28016];
            const results = await Promise.all(ports.map(p => SteamQueryManager.isPlayerOnline(ip, p, player.name).catch(() => false)));
            isOnline = results.some(r => r === true);
            serverName = player.targetServerIp;

            // 2. Si Horus falla y tenemos ID de BattleMetrics, usar Intel API
            if (!isOnline && player.id && !player.id.startsWith('horus-')) {
                console.log(`[Tracking] Horus no ve a ${player.name}. Consultando Intel API...`);
                const bmServer = await BattleMetricsManager.getServerByIP(ip, portStr);
                if (bmServer) {
                    const status = await BattleMetricsManager.getPlayerStatus(bmServer.id, player.id);
                    if (status) isOnline = status.isOnline;
                }
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
