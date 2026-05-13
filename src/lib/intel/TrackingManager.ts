import { BattleMetricsManager } from "./BattleMetricsManager";
import db, { getTrackedPlayers, updatePlayerStatus } from "../db";
import { DiscordManager } from "../discord/DiscordManager";

export class TrackingManager {
  private static interval: NodeJS.Timeout | null = null;

  /**
   * Inicia el ciclo de monitoreo de jugadores seguidos.
   */
  static start(intervalMs: number = 300000) { // Default 5 mins
    if (this.interval) return;

    console.log("[TrackingManager] Iniciando servicio de vigilancia de jugadores...");
    
    this.checkTrackedPlayers(); // Ejecución inmediata inicial
    
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
   * Realiza una pasada de verificación sobre todos los jugadores en la lista de seguimiento.
   */
  private static async checkTrackedPlayers() {
    const tracked = getTrackedPlayers();
    if (tracked.length === 0) return;

    console.log(`[TrackingManager] Verificando estado de ${tracked.length} objetivos...`);

    for (const player of tracked) {
      try {
        // Buscamos al jugador por su ID de BattleMetrics
        const res = await BattleMetricsManager.searchPlayer(player.id); // Reutilizamos searchPlayer pero pasando el ID si es numérico
        
        // Nota: searchPlayer actualmente busca por nombre. 
        // Deberíamos añadir un getPlayerById para ser más precisos.
        // Por ahora, asumimos que si pasamos el ID como query, BM lo encontrará.
        
        const playerData = res.data?.[0]; // En BM, buscar por ID exacto devuelve el jugador
        if (!playerData) continue;

        const sessions = await BattleMetricsManager.getPlayerSessions(player.id);
        const activeSession = sessions.find((s: any) => s.attributes.stop === null);

        const newStatus = activeSession ? 'online' : 'offline';
        const serverId = activeSession?.relationships?.server?.data?.id;

        // Si el estado ha cambiado, notificamos
        if (player.status !== newStatus) {
            console.log(`[TrackingManager] CAMBIO DE ESTADO: ${player.name} -> ${newStatus}`);
            
            let serverName = "";
            if (serverId) {
                // Opcional: Obtener nombre del servidor
                const sInfo = await BattleMetricsManager.getServerInfo(serverId);
                serverName = sInfo?.data?.attributes?.name || "Servidor Desconocido";
            }

            updatePlayerStatus(player.id, newStatus, serverId, serverName);

            // Notificar vía Discord a todos los servidores que tengan configurado un canal
            const msg = newStatus === 'online' 
                ? `🎯 **OBJETIVO DETECTADO**: El jugador **${player.name}** se ha conectado a **${serverName}**.`
                : `🌫️ **OBJETIVO PERDIDO**: El jugador **${player.name}** se ha desconectado.`;

            this.notifyDiscord(msg);
        }
      } catch (err) {
        console.error(`[TrackingManager] Error verificando a ${player.name}:`, err);
      }

      // Pequeño delay para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  private static notifyDiscord(message: string) {
    // Aquí podrías iterar los servidores de la DB y enviar a sus webhooks
    // Por simplicidad, buscamos servidores con webhook configurado
    try {
        const servers = db.prepare("SELECT * FROM servers WHERE discordWebhook IS NOT NULL OR discordChannelId IS NOT NULL").all() as any[];
        for (const s of servers) {
            DiscordManager.sendGenericAlert(s, "Inteligencia de Jugadores", message);
        }
    } catch (e) {
        console.error("[TrackingManager] Error notificando a Discord:", e);
    }
  }
}
