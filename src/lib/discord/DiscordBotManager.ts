import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from "discord.js";

class DiscordBotManager {
  private client: Client | null = null;
  private isConnected: boolean = false;

  async init() {
    if (this.client) return;

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.warn("[Discord Bot] No DISCORD_BOT_TOKEN found in environment variables.");
      return;
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
    });

    this.client.once("ready", () => {
      this.isConnected = true;
      console.log(`[Discord Bot] Logged in as ${this.client?.user?.tag}! Ready to serve.`);
    });

    this.client.on("error", (error) => {
      console.error("[Discord Bot] Client Error:", error);
    });

    try {
      await this.client.login(token);
    } catch (err) {
      console.error("[Discord Bot] Failed to login:", err);
      this.client = null;
    }
  }

  async sendEmbed(channelId: string, embedData: any) {
    if (!this.client || !this.isConnected) {
      console.warn("[Discord Bot] Cannot send message: Client not connected.");
      return;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        const embed = new EmbedBuilder(embedData);
        await (channel as TextChannel).send({ embeds: [embed] });
        return true;
      } else {
        console.warn(`[Discord Bot] Channel ${channelId} not found or not text-based.`);
      }
    } catch (err) {
      console.error(`[Discord Bot] Error sending message to ${channelId}:`, err);
    }
    return false;
  }

  getIsConnected() {
    return this.isConnected;
  }
}

// Singleton instance
const globalStore = global as any;
export const discordBotManager: DiscordBotManager = globalStore._discordBotManager || (globalStore._discordBotManager = new DiscordBotManager());
