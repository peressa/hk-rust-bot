/*
    Módulo de Analítica de Clan - HK Rust Bot
    Permite visualizar estadísticas de K/D y raideos históricos.
*/

const Builder = require('@discordjs/builders');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const Constants = require('../util/constants.js');
const db = require('../structures/database');

module.exports = {
    name: 'clan',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('clan')
            .setDescription(client.intlGet(guildId, 'commandsClanDesc'))
            .addSubcommand(subcommand => subcommand
                .setName('stats')
                .setDescription(client.intlGet(guildId, 'commandsClanStatsDesc')))
            .addSubcommand(subcommand => subcommand
                .setName('raids')
                .setDescription(client.intlGet(guildId, 'commandsClanRaidsDesc')))
            .addSubcommand(subcommand => subcommand
                .setName('deaths')
                .setDescription(client.intlGet(guildId, 'noRecentDeaths'))); // Reutilizando key
    },

    async execute(client, interaction) {
        const verifyId = Math.floor(100000 + Math.random() * 900000);
        client.logInteraction(interaction, verifyId, 'slashCommand');

        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: false });

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        try {
            if (subcommand === 'stats') {
                await this.handleStats(client, interaction, guildId);
            } else if (subcommand === 'raids') {
                await this.handleRaids(client, interaction, guildId);
            } else if (subcommand === 'deaths') {
                await this.handleDeaths(client, interaction, guildId);
            }
        } catch (error) {
            console.error('[CLAN COMMAND ERROR]', error);
            await interaction.editReply('❌ Error al obtener los datos de analítica.');
        }
    },

    async handleStats(client, interaction, guildId) {
        // Consultar K/D Global del Clan (últimos 7 días)
        const kills = db.db.prepare('SELECT COUNT(*) as count FROM death_logs WHERE guild_id = ? AND attacker_id IS NOT NULL').get(guildId).count;
        const deaths = db.db.prepare('SELECT COUNT(*) as count FROM death_logs WHERE guild_id = ?').get(guildId).count;
        const raids = db.db.prepare('SELECT COUNT(*) as count FROM event_logs WHERE guild_id = ? AND event_type = "raid"').get(guildId).count;

        const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);

        const embed = DiscordEmbeds.getEmbed({
            title: `🛡️ ${client.intlGet(guildId, 'clanStatsTitle')}`,
            color: Constants.COLOR_DEFAULT,
            description: `Resumen de actividad de los últimos 7 días.`,
            fields: [
                { name: '⚔️ Kills', value: `\`${kills}\``, inline: true },
                { name: '💀 Muertes', value: `\`${deaths}\``, inline: true },
                { name: '📉 Ratio K/D', value: `\`${kd}\``, inline: true },
                { name: '🔥 Raideos Detectados', value: `\`${raids}\``, inline: false }
            ]
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async handleRaids(client, interaction, guildId) {
        const rows = db.db.prepare('SELECT * FROM event_logs WHERE guild_id = ? AND event_type = "raid" ORDER BY created_at DESC LIMIT 10').all(guildId);

        if (rows.length === 0) {
            return await interaction.editReply(client.intlGet(guildId, 'noRecentRaids'));
        }

        let description = '';
        for (const row of rows) {
            const time = Math.floor(new Date(row.created_at).getTime() / 1000);
            description += `🚨 **${row.title}**\n <t:${time}:R> - ${row.message}\n\n`;
        }

        const embed = DiscordEmbeds.getEmbed({
            title: `🚨 ${client.intlGet(guildId, 'clanRaidsTitle')}`,
            color: 0xFF0000,
            description: description
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async handleDeaths(client, interaction, guildId) {
        const rows = db.db.prepare('SELECT * FROM death_logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT 10').all(guildId);

        if (rows.length === 0) {
            return await interaction.editReply(client.intlGet(guildId, 'noRecentDeaths'));
        }

        let description = '';
        for (const row of rows) {
            const time = Math.floor(new Date(row.created_at).getTime() / 1000);
            const attacker = row.attacker_name || 'Desconocido';
            description += `💀 Miembro eliminado por **${attacker}**\n <t:${time}:R> con \`${row.weapon || '?'}\` (${row.distance?.toFixed(1)}m)\n\n`;
        }

        const embed = DiscordEmbeds.getEmbed({
            title: `💀 Recientes Muertes del equipo`,
            color: 0x000000,
            description: description
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
