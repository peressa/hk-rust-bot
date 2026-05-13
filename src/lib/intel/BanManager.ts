import { getBanWatchlist, updateBanStatus, getServers } from "../db";
import { rustPlusManager } from "../rustplus/RustPlusManager";
import { DiscordManager } from "../discord/DiscordManager";

export class BanManager {
  private static interval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static async init() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[Ban Manager] Vigilancia global de baneos activada (Ciclo: 24h).");

    // Revisión global una vez al día (86,400,000 ms)
    this.interval = setInterval(() => this.checkWatchlist(), 86400000);
    
    // Ejecutar una vez al inicio para estar al día
    setImmediate(() => this.checkWatchlist());
  }

  static async checkWatchlist() {
    try {
      const watchlist = getBanWatchlist();
      if (watchlist.length === 0) return;

      console.log(`[Ban Manager] Revisando baneo para ${watchlist.length} sospechosos...`);

      for (const target of watchlist) {
        // Ignorar si ya sabemos que está baneado (opcional, por si queremos re-confirmar)
        if (target.isBanned) continue;

        const banInfo = await this.checkSteamBan(target.steamId);
        
        if (banInfo.isBanned) {
          await this.handleNewBan(target, banInfo);
        }
      }
    } catch (err) {
      console.error("[Ban Manager] Error:", err);
    }
  }

  private static async checkSteamBan(steamId: string) {
    try {
      // Usamos BattleMetrics como fuente de baneo porque detecta EAC y baneos de servidor
      const res = await fetch(`https://api.battlemetrics.com/players?filter[search]=${steamId}`);
      if (!res.ok) return { isBanned: false };
      
      const data = await res.json();
      const player = data.data?.[0];
      
      if (!player) return { isBanned: false };

      // BattleMetrics marca baneos globales o de EAC a veces en atributos
      const isBanned = player.attributes?.isBanned || false;
      const positiveMatch = player.attributes?.positiveMatch || false; // Coincidencia positiva de baneo
      
      if (isBanned || positiveMatch) {
        return { 
          isBanned: true, 
          currentName: player.attributes?.name,
          type: positiveMatch ? 'EAC / Game Ban' : 'Server Ban',
          details: player.attributes?.details || 'Detección automática'
        };
      }

      return { isBanned: false };
    } catch (e) {
      return { isBanned: false };
    }
  }

  private static async handleNewBan(target: any, banInfo: any) {
    // Intentamos obtener el nombre más actual de la respuesta de búsqueda
    const currentName = banInfo.currentName || target.name || "Jugador Desconocido";
    const steamId = target.steamId;

    console.log(`[Ban Manager] !!! BAN DETECTADO !!! ${currentName} (${steamId})`);

    updateBanStatus(steamId, true, banInfo.type);

    const steamUrl = `https://steamcommunity.com/profiles/${steamId}`;

    try {
      const allServers = (global as any).db.prepare("SELECT * FROM servers").all() as any[];
      
      for (const server of allServers) {
        // 1. Notificar Discord
        if (server.discordWebhook || server.discordChannelId) {
          DiscordManager.sendGenericAlert(
            { webhookUrl: server.discordWebhook, channelId: server.discordChannelId },
            "Baneo Global Detectado",
            `**Jugador:** ${currentName}\n**SteamID:** [${steamId}](${steamUrl})\n**Tipo:** ${banInfo.type}\n\nEste jugador estaba en la lista de vigilancia global.`
          );
        }

        // 2. Notificar Team Chat de Rust (si está conectado)
        if (rustPlusManager.isConnected(server.steamId, server.ip)) {
           // Usamos el mismo prefijo que siempre (rustPlusManager.formatMsg lo maneja)
           const formatted = rustPlusManager.formatMsg(server.steamId, server.ip, 'ban_alert', `🚨 ¡BAN GLOBAL! {name} ({steamId}) ha sido baneado. Tipo: {type}`, { 
             name: currentName, 
             steamId: steamId,
             type: banInfo.type 
           });
           rustPlusManager.botSendTeamMessage(server.steamId, server.ip, formatted);
        }
      }
    } catch (e) {
      console.error("[Ban Manager] Error notificando baneo:", e);
    }
  }
}
