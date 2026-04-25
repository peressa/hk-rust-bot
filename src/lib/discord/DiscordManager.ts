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
            username: "Rust Ops Tactical",
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
        title: `🚨 DISPOSITIVO ACTIVADO`,
        description: `**Alarma:** ${title}\n**Estado:** ${message}`,
        color: 0xeab308, // Amarillo
        author: { name: "RUST OPS TACTICAL", icon_url: this.AVATAR_URL },
        footer: { text: `📡 Enlace Directo: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendDeath(config: DiscordConfig, playerName: string, x: number, y: number, serverName: string, killer?: string) {
    await this.sendNotify(config, {
      embeds: [{
        title: `💀 JUGADOR CAÍDO`,
        fields: [
          { name: "Víctima", value: `\`${playerName}\``, inline: true },
          { name: "Eliminado por", value: `\`${killer || "Desconocido"}\``, inline: true },
          { name: "Ubicación", value: `\`X: ${Math.round(x)}, Y: ${Math.round(y)}\``, inline: false }
        ],
        color: 0xef4444, // Rojo
        author: { name: "RUST OPS TACTICAL", icon_url: this.AVATAR_URL },
        footer: { text: `📡 Enlace Directo: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendRaidAlert(config: DiscordConfig, grid: string, serverName: string) {
    await this.sendNotify(config, {
      embeds: [{
        title: `🧨 ¡ALERTA DE RAID POSIBLE!`,
        description: `Se han detectado múltiples explosiones en el cuadrante **${grid}**.\n*Respuesta inmediata recomendada.*`,
        color: 0xce422b, // Rojo Rust
        author: { name: "SISTEMA DE DEFENSA ACTIVA", icon_url: this.AVATAR_URL },
        thumbnail: { url: "https://files.facepunch.com/lewis/1b2911b1/rust-header.jpg" },
        footer: { text: `📡 Enlace Directo: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendEvent(config: DiscordConfig, eventName: string, grid: string, serverName: string) {
    await this.sendNotify(config, {
      embeds: [{
        title: `🌍 EVENTO GLOBAL DETECTADO`,
        description: `**Objeto:** ${eventName}\n**Cuadrante:** ${grid}`,
        color: 0x3b82f6, // Azul
        author: { name: "INTELIGENCIA ESTRATÉGICA", icon_url: this.AVATAR_URL },
        footer: { text: `📡 Enlace Directo: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendPairing(config: DiscordConfig, serverName: string, ip: string, port: string) {
    await this.sendNotify(config, {
      embeds: [{
        title: `🔗 ENLACE SATELITAL ESTABLECIDO`,
        description: `Rust Ops se ha sincronizado con el terminal remoto.\nIP: \`${ip}:${port}\``,
        color: 0x22c55e, // Verde
        author: { name: "RUST OPS TACTICAL", icon_url: this.AVATAR_URL },
        footer: { text: `📡 Enlace Directo: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }
}

