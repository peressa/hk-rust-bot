/*
    [MÓDULO 4] - Comando /stats o /info (Cheater Check)
    Esqueleto preparado para consultar la Steam Web API.
*/

const Builder = require('@discordjs/builders');
// TODO: Si se usa node-fetch nativo en Node 18+ o axios:
// const axios = require('axios');

module.exports = {
    name: 'stats',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('stats')
            .setDescription('Revisar estadísticas de un jugador en Steam (Cheater Check)')
            .addStringOption(option => option
                .setName('steam_id_o_url')
                .setDescription('El SteamID64 o la URL del perfil completo')
                .setRequired(true));
    },

    async execute(client, interaction) {
        // ID de validación interno de la plantilla de rustplusplus
        const verifyId = Math.floor(100000 + Math.random() * 900000);
        client.logInteraction(interaction, verifyId, 'slashCommand');

        // Solo procesamos si tiene permisos y la aplicación responde
        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: false });

        const input = interaction.options.getString('steam_id_o_url');
        
        // 1. Parsear el Steam ID (extraer ID numérico si enviaron una URL)
        let steamId64 = input; // TODO: Lógica para parsear regex de steamcommunity.com/profiles/ o /id/

        const STEAM_API_KEY = process.env.STEAM_API_KEY;
        if (!STEAM_API_KEY) {
            return await interaction.editReply('❌ No hay clave de Steam Web API configurada en `.env`.');
        }

        try {
            // =========================================================
            // Lógica para obtener el perfil y bans
            // Documentación API: GetPlayerBans, GetPlayerSummaries
            // =========================================================
            
            /* TODO Módulo:
            const bansUrl = `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${STEAM_API_KEY}&steamids=${steamId64}`;
            const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId64}`;
            const gamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&appids_filter[0]=252490`; // Rust AppID
            
            1. Hacer requests a las 3 URLs concurrentemente (Promise.all)
            2. Extraer `VACBanned`, `NumberOfVACBans`, `NumberOfGameBans` (EAC/Rust).
            3. Extraer `timecreated` para la antigüedad de la cuenta.
            4. Extraer el tiempo de juego (`playtime_forever`) de Rust en `gamesUrl`.
            5. Armar el Embed visual de Discord para enviarlo.
            */

            // Mensaje de pruebas (Esqueleto)
            await interaction.editReply({
                content: `🔍 **Resultados de Análisis para:** \`${steamId64}\`\n` +
                         `> ⏱ **Antigüedad:** [Pendiente] \n` +
                         `> ☢ **VAC Bans:** [Pendiente] \n` +
                         `> 🚫 **Game Bans (EAC):** [Pendiente] \n` +
                         `> 🎮 **Horas en Rust (AppID 252490):** [Pendiente] \n` +
                         `*(Módulo esqueleto implementado con éxito)*`
            });

        } catch (error) {
            console.error('[STATS CHECKER ERROR]', error);
            await interaction.editReply('Ocurrió un error consultando la API de Steam.');
        }
    }
};
