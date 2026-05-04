import { Client, GatewayIntentBits, EmbedBuilder, TextChannel, Interaction, REST, Routes, SlashCommandBuilder, Events, MessageFlags } from "discord.js";
import { getWhitelistByDiscordId, getServers, linkDiscordId } from "../db";
import { rustPlusManager } from "../rustplus/RustPlusManager";

class DiscordBotManager {
  private client: Client | null = null;
  private isConnected: boolean = false;

  async init() {
    if (this.client) return;

    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!token) {
      console.warn("[Discord Bot] No DISCORD_BOT_TOKEN found. El bot no se iniciará.");
      return;
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.once(Events.ClientReady, async (c) => {
      this.isConnected = true;
      console.log(`[Discord Bot] Conectado como ${c.user.tag}!`);
      
      if (clientId) {
        await this.registerCommands(token, clientId);
      }
    });

    this.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;

      // Diferimos la respuesta de inmediato para evitar el timeout de 3 segundos
      await interaction.deferReply();

      console.log(`[Discord Bot] Comando /${interaction.commandName} recibido de ${interaction.user.tag} (${interaction.user.id})`);
      
      let user = getWhitelistByDiscordId(interaction.user.id);
      
      // Auto-vínculo de emergencia para el Admin
      if (!user && interaction.user.id === process.env.DISCORD_ADMIN_ID) {
          const adminSteamId = process.env.ADMIN_STEAM_ID?.trim();
          if (adminSteamId) {
              linkDiscordId(adminSteamId, interaction.user.id);
              user = getWhitelistByDiscordId(interaction.user.id);
          }
      }
      
      if (!user) {
        return await interaction.editReply({ 
          content: "❌ No tienes permiso para usar este bot. Vincula tu Discord en el Dashboard web primero."
        });
      }

      try {
        switch (interaction.commandName) {
          case "status":
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("🛰️ RUST OPS - STATUS")
                  .setDescription("El sistema de inteligencia táctica está operativo.")
                  .setColor(0x22c55e)
                  .setTimestamp()
              ]
            });
            break;

          case "team":
            await this.handleTeamCommand(interaction, user.steamId);
            break;

          case "pop":
            await this.handlePopCommand(interaction, user.steamId);
            break;
        }
      } catch (err) {
        console.error(`[Discord Bot] Error en comando /${interaction.commandName}:`, err);
        if (!interaction.replied) await interaction.reply({ content: "⚠️ Hubo un error procesando el comando." });
      }
    });

    this.client.on(Events.Error, (error) => {
      console.error("[Discord Bot] Error del Cliente:", error);
    });

    try {
      await this.client.login(token);
    } catch (err) {
      console.error("[Discord Bot] Error al iniciar sesión:", err);
      this.client = null;
    }
  }

  private async handleTeamCommand(interaction: Interaction, steamId: string) {
    if (!interaction.isChatInputCommand()) return;
    
    const servers = getServers(steamId);
    if (servers.length === 0) return await interaction.editReply("No tienes servidores conectados.");

    const server = servers[0]; // Simplificación: Tomamos el primero
    try {
      const teamResp = await rustPlusManager.sendRequest(steamId, server.ip, { getTeamInfo: {} });
      const members = teamResp.response.teamInfo.members || [];
      const online = members.filter((m: any) => m.isOnline).length;
      
      const embed = new EmbedBuilder()
        .setTitle(`👥 Equipo en ${server.name}`)
        .setDescription(`${online} jugadores online de ${members.length} totales.`)
        .setColor(0x3b82f6)
        .addFields(members.map((m: any) => ({
          name: m.name,
          value: m.isOnline ? "🟢 Online" : "⚪ Offline",
          inline: true
        })));

      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply("❌ Error al conectar con el servidor de Rust.");
    }
  }

  private async handlePopCommand(interaction: Interaction, steamId: string) {
    if (!interaction.isChatInputCommand()) return;
    
    const servers = getServers(steamId);
    if (servers.length === 0) return await interaction.editReply("No tienes servidores conectados.");

    const server = servers[0];
    try {
      const infoResp = await rustPlusManager.sendRequest(steamId, server.ip, { getInfo: {} });
      const i = infoResp.response.info;
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 Población: ${server.name}`)
        .addFields(
          { name: "Jugadores", value: `${i.players} / ${i.maxPlayers}`, inline: true },
          { name: "Cola", value: `${i.queued}`, inline: true }
        )
        .setColor(0xeab308);

      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply("❌ Error al obtener información del servidor.");
    }
  }

  private async registerCommands(token: string, clientId: string) {
    const commands = [
      new SlashCommandBuilder()
        .setName("status")
        .setDescription("Verifica el estado del bot de Rust Ops"),
      new SlashCommandBuilder()
        .setName("team")
        .setDescription("Ver estado del equipo en el servidor principal"),
      new SlashCommandBuilder()
        .setName("pop")
        .setDescription("Ver población del servidor"),
    ].map(command => command.toJSON());

    const rest = new REST({ version: "10" }).setToken(token);

    try {
      console.log("[Discord Bot] Registrando comandos slash...");
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log("[Discord Bot] Comandos slash registrados con éxito.");
    } catch (error) {
      console.error("[Discord Bot] Error registrando comandos:", error);
    }
  }

  async sendEmbed(channelId: string, embedData: any) {
    if (!this.client || !this.isConnected) {
      console.warn("[Discord Bot] No se puede enviar el mensaje: Bot desconectado.");
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        const embed = new EmbedBuilder(embedData);
        await (channel as TextChannel).send({ embeds: [embed] });
        return true;
      }
    } catch (err) {
      console.error(`[Discord Bot] Error enviando embed a ${channelId}:`, err);
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
