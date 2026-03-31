/*
    [MÓDULO 2] - A2S Tracker (Query)
    Módulo independiente para hacer queries de A2S y obtener conexiones/desconexiones.
*/

// TODO: Instalar librería 'gamedig' usando: npm install gamedig
// const { GameDig } = require('gamedig');

class A2STracker {
    constructor(client, guildId, serverIp, queryPort) {
        this.client = client;
        this.guildId = guildId;
        this.serverIp = serverIp;
        this.queryPort = queryPort;
        
        this.interval = null;
        this.intervalMs = 30000; // Consultar cada 30 segundos
        
        // Estado anterior de jugadores para calcular el DIFF
        this.previousPlayers = []; 
    }

    start() {
        if (this.interval) return;
        console.log(`[A2S Tracker] Iniciado en ${this.serverIp}:${this.queryPort}`);
        
        this.interval = setInterval(async () => {
            await this.pollServer();
        }, this.intervalMs);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log(`[A2S Tracker] Detenido.`);
        }
    }

    async pollServer() {
        try {
            /* TODO Lógica:
            const state = await GameDig.query({
                type: 'rust',
                host: this.serverIp,
                port: this.queryPort
            });

            // Gamedig en Rust normalmente retorna state.players como un Array de objetos con el nombre y metadata.
            const currentPlayers = state.players.map(p => p.name || "Unknown");
            
            // Calculamos el diff:
            const joined = currentPlayers.filter(p => !this.previousPlayers.includes(p));
            const left = this.previousPlayers.filter(p => !currentPlayers.includes(p));
            
            // Notificamos si hay novedades:
            if (joined.length > 0) {
                // Notificar en Discord usando DiscordMessages.js o buscar el canal
                // DiscordMessages.sendTrackerUpdate(this.guildId, "➕ Conectado", joined);
            }
            if (left.length > 0) {
                // DiscordMessages.sendTrackerUpdate(this.guildId, "➖ Desconectado", left);
            }

            // Actualizamos la lista
            this.previousPlayers = currentPlayers;
            */
            
            // Simulación de depuración:
            // console.log(`[A2S Tracker] Buscando Novedades en ${this.serverIp}`);

        } catch (error) {
            console.error(`[A2S Tracker] Error consultando servidor:`, error.message);
        }
    }
}

module.exports = A2STracker;
