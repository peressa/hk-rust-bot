import { discordBotManager } from "./DiscordBotManager";

export interface DiscordConfig {
  webhookUrl?: string;
  channelId?: string;
}

export class DiscordManager {
  private static AVATAR_URL = process.env.DISCORD_AVATAR_URL || "https://files.facepunch.com/lewis/1b2911b1/rust-header.jpg";

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

  private static async sendBaseEmbed(config: DiscordConfig, options: {
    title: string;
    description?: string;
    fields?: any[];
    color: number;
    authorName: string;
    serverName: string;
    thumbnail?: string;
  }) {
    await this.sendNotify(config, {
      embeds: [{
        title: options.title,
        description: options.description,
        fields: options.fields,
        color: options.color,
        author: { name: options.authorName, icon_url: this.AVATAR_URL },
        thumbnail: options.thumbnail ? { url: options.thumbnail } : undefined,
        footer: { text: `📡 Enlace Directo: ${options.serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendAlarm(config: DiscordConfig, title: string, message: string, serverName: string) {
    await this.sendBaseEmbed(config, {
      title: `🚨 DISPOSITIVO ACTIVADO`,
      description: `**Alarma:** ${title}\n**Estado:** ${message}`,
      color: 0xeab308, // Amarillo
      authorName: "RUST OPS TACTICAL",
      serverName
    });
  }

  static async sendDeath(config: DiscordConfig, playerName: string, x: number, y: number, serverName: string, killer?: string) {
    await this.sendBaseEmbed(config, {
      title: `💀 JUGADOR CAÍDO`,
      fields: [
        { name: "Víctima", value: `\`${playerName}\``, inline: true },
        { name: "Eliminado por", value: `\`${killer || "Desconocido"}\``, inline: true },
        { name: "Ubicación", value: `\`X: ${Math.round(x)}, Y: ${Math.round(y)}\``, inline: false }
      ],
      color: 0xef4444, // Rojo
      authorName: "RUST OPS TACTICAL",
      serverName
    });
  }

  static async sendRaidAlert(config: DiscordConfig, grid: string, serverName: string) {
    await this.sendBaseEmbed(config, {
      title: `🧨 ¡ALERTA DE RAID POSIBLE!`,
      description: `Se han detectado múltiples explosiones en el cuadrante **${grid}**.\n*Respuesta inmediata recomendada.*`,
      color: 0xce422b, // Rojo Rust
      authorName: "SISTEMA DE DEFENSA ACTIVA",
      thumbnail: this.AVATAR_URL,
      serverName
    });
  }

  static async sendEvent(config: DiscordConfig, eventName: string, grid: string, serverName: string) {
    await this.sendBaseEmbed(config, {
      title: `🌍 EVENTO GLOBAL DETECTADO`,
      description: `**Objeto:** ${eventName}\n**Cuadrante:** ${grid}`,
      color: 0x3b82f6, // Azul
      authorName: "INTELIGENCIA ESTRATÉGICA",
      serverName
    });
  }

  static async sendPresence(config: DiscordConfig, playerName: string, steamId: string, isOnline: boolean, serverName: string) {
    await this.sendBaseEmbed(config, {
      title: isOnline ? `✅ JUGADOR CONECTADO` : `❌ JUGADOR DESCONECTADO`,
      description: `**${playerName}** ${isOnline ? "se ha unido al servidor" : "ha salido del servidor"}.`,
      fields: [
        { name: "SteamID", value: `\`${steamId}\``, inline: true },
        { name: "Estado", value: isOnline ? "🟢 Online" : "🔴 Offline", inline: true }
      ],
      color: isOnline ? 0x22c55e : 0xef4444,
      authorName: "RUST OPS TACTICAL",
      serverName
    });
  }

  static async sendPairing(config: DiscordConfig, serverName: string, ip: string, port: string) {
    await this.sendBaseEmbed(config, {
      title: `🔗 ENLACE SATELITAL ESTABLECIDO`,
      description: `Rust Ops se ha sincronizado con el terminal remoto.\nIP: \`${ip}:${port}\``,
      color: 0x22c55e, // Verde
      authorName: "RUST OPS TACTICAL",
      serverName
    });
  }

  static async sendGenericAlert(config: DiscordConfig, title: string, message: string) {
    await this.sendBaseEmbed(config, {
      title,
      description: message,
      color: 0x3b82f6, // Azul neutral
      authorName: "RUST OPS TACTICAL",
      serverName: "Notificación de Sistema"
    });
  }
}

