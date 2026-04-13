import { discordBotManager } from "./DiscordBotManager";

export interface DiscordConfig {
  webhookUrl?: string;
  channelId?: string;
}

export class DiscordManager {
  private static AVATAR_URL = "https://files.facepunch.com/lewis/1b2911b1/rust-header.jpg";

  static async sendNotify(config: DiscordConfig, payload: any) {
    // 1. Intentar vía Bot Real (si hay channelId)
    if (config.channelId && discordBotManager.getIsConnected()) {
      const embed = payload.embeds?.[0];
      if (embed) {
        await discordBotManager.sendEmbed(config.channelId, embed);
      }
    }

    // 2. Intentar vía Webhook (si hay webhookUrl)
    if (config.webhookUrl) {
      try {
        const res = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "RUST OPS",
            avatar_url: this.AVATAR_URL,
            ...payload
          })
        });
        if (!res.ok) {
          console.warn(`[Discord] Webhook Error: ${res.status}`);
        }
      } catch (err) {
        console.warn("[Discord] Webhook failed:", err);
      }
    }
  }

  static async sendAlarm(config: DiscordConfig, title: string, message: string, serverName: string) {
    await this.sendNotify(config, {
      embeds: [{
        title: `🚨 Alarma: ${title}`,
        description: message,
        color: 0xeab308, // Amarillo
        footer: { text: `Servidor: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendDeath(config: DiscordConfig, playerName: string, x: number, y: number, serverName: string, killer?: string) {
    const description = killer 
      ? `**${playerName}** fue eliminado por **${killer}**.\nCoordenadas: \`X: ${Math.round(x)}, Y: ${Math.round(y)}\``
      : `**${playerName}** ha muerto.\nCoordenadas: \`X: ${Math.round(x)}, Y: ${Math.round(y)}\``;

    await this.sendNotify(config, {
      embeds: [{
        title: `💀 Jugador Caído: ${playerName}`,
        description: description,
        color: 0xef4444, // Rojo
        footer: { text: `Servidor: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendEvent(config: DiscordConfig, eventName: string, grid: string, serverName: string) {
    await this.sendNotify(config, {
      embeds: [{
        title: `🌍 Evento Detectado: ${eventName}`,
        description: `Se ha detectado actividad en **${grid}**.`,
        color: 0x3b82f6, // Azul
        footer: { text: `Servidor: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendPairing(config: DiscordConfig, serverName: string, ip: string, port: string) {
    await this.sendNotify(config, {
      embeds: [{
        title: `🔗 Enlace Satelital Establecido`,
        description: `RUST OPS se ha emparejado exitosamente con el servidor.\nIP: \`${ip}:${port}\``,
        color: 0x22c55e, // Verde
        footer: { text: `Servidor: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }
}

