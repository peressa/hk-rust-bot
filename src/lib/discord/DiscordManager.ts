export class DiscordManager {
  static async sendWebhook(webhookUrl: string, payload: any) {
    if (!webhookUrl) return;
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.warn(`[Discord] Error sending webhook: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.warn("[Discord] Failed to run webhook fetch:", err);
    }
  }

  static async sendAlarm(webhookUrl: string, title: string, message: string, serverName: string) {
    await this.sendWebhook(webhookUrl, {
      username: "HK Sentinel",
      avatar_url: "https://files.facepunch.com/lewis/1b2911b1/rust-header.jpg",
      embeds: [{
        title: `🚨 Alarma: ${title}`,
        description: message,
        color: 0xeab308, // Amarillo
        footer: { text: `Servidor: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendDeath(webhookUrl: string, playerName: string, x: number, y: number, serverName: string) {
    await this.sendWebhook(webhookUrl, {
      username: "HK Sentinel",
      avatar_url: "https://files.facepunch.com/lewis/1b2911b1/rust-header.jpg",
      embeds: [{
        title: `💀 Jugador Caído: ${playerName}`,
        description: `**${playerName}** ha muerto en combate.\nCoordenadas: \`X: ${Math.round(x)}, Y: ${Math.round(y)}\``,
        color: 0xef4444, // Rojo
        footer: { text: `Servidor: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }

  static async sendPairing(webhookUrl: string, serverName: string, ip: string, port: string) {
    await this.sendWebhook(webhookUrl, {
      username: "HK Sentinel",
      avatar_url: "https://files.facepunch.com/lewis/1b2911b1/rust-header.jpg",
      embeds: [{
        title: `🔗 Enlace Satelital Establecido`,
        description: `HK Bot se ha emparejado exitosamente con el servidor.\nIP: \`${ip}:${port}\``,
        color: 0x22c55e, // Verde
        footer: { text: `Servidor: ${serverName}` },
        timestamp: new Date().toISOString()
      }]
    });
  }
}

