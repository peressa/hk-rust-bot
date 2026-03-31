const DiscordBot = require('./DiscordBot');
const Discord = require('discord.js');
const db = require('./database');

class BotManager {
    constructor() {
        this.instances = new Map(); // steam_id -> DiscordBot instance
        this.defaultOptions = {
            intents: [
                Discord.GatewayIntentBits.Guilds,
                Discord.GatewayIntentBits.GuildMessages,
                Discord.GatewayIntentBits.MessageContent,
                Discord.GatewayIntentBits.GuildMembers,
                Discord.GatewayIntentBits.GuildVoiceStates],
            retryLimit: 2,
            restRequestTimeout: 60000,
            disableEveryone: false
        };
    }

    /**
     * Inicia un bot para un usuario específico.
     */
    async startBot(steamId, token) {
        if (this.instances.has(steamId)) {
            console.log(`[BotManager] Bot ya en ejecución para ${steamId}`);
            return this.instances.get(steamId);
        }

        // Obtener configuración de Rust del tenant
        const tenant = db.getTenant(steamId);
        const rustConfig = (tenant && tenant.rust_ip) ? {
            ip: tenant.rust_ip,
            port: tenant.rust_port,
            steamId: tenant.rust_steam_id,
            token: tenant.rust_token
        } : null;

        console.log(`[BotManager] Iniciando bot para ${steamId}${rustConfig ? ' con conexión Rust+' : ''}...`);
        const client = new DiscordBot(this.defaultOptions);
        
        try {
            // Pasamos token y configuración de Rust
            await client.build(token, rustConfig); 
            this.instances.set(steamId, client);
            db.updateBotStatus(steamId, 1);
            return client;
        } catch (error) {
            console.error(`[BotManager] Error al iniciar bot para ${steamId}:`, error);
            throw error;
        }
    }

    /**
     * Detiene un bot para un usuario específico.
     */
    async stopBot(steamId) {
        if (!this.instances.has(steamId)) return;

        const client = this.instances.get(steamId);
        await client.destroy();
        this.instances.delete(steamId);
        db.updateBotStatus(steamId, 0);
        console.log(`[BotManager] Bot detenido para ${steamId}`);
    }

    /**
     * Carga todos los bots que estaban marcados como activos en la base de datos.
     */
    async bootAllActive() {
        const activeTenants = db.getAllActiveTenants();
        console.log(`[BotManager] Reactivando ${activeTenants.length} bots...`);
        
        for (const tenant of activeTenants) {
            if (tenant.discord_token) {
                try {
                    await this.startBot(tenant.steam_id, tenant.discord_token);
                } catch (e) {
                    console.error(`[BotManager] Fallo al reactivar bot para ${tenant.steam_id}`);
                }
            }
        }
    }
}

module.exports = new BotManager();
