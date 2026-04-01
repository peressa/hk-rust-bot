const DiscordCommandHandler = require('../handlers/discordCommandHandler.js');
const db = require('../structures/database');
const Intl = require('../util/intl');

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        if (!message.guild) return; // Ignore DMs

        const _log = (t, m, l = 'info') => {
            if (typeof client.log === 'function') return client.log(t, m, l);
            if (typeof client._safeLog === 'function') return client._safeLog(t, m, l);
            Intl.log(t, m, l);
        };
        const _intlGet = (g, id, v = {}) => {
            if (typeof client.intlGet === 'function') return client.intlGet(g, id, v);
            return Intl.get(id, v);
        };

        const guildConfig = db.getGuildConfig(message.guild.id);
        const rustplus = client.rustplusInstances[message.guild.id];

        if (message.author.bot || !rustplus || (rustplus && !rustplus.isOperational)) return;

        // Sincronizar chat Discord -> Rust o manejar comandos
        if (guildConfig && message.channelId === guildConfig.chat_channel_id) {
            await rustplus.sendInGameMessage(`${message.author.username}: ${message.cleanContent}`);
            _log(_intlGet(null, 'infoCap'), `Chat Sync Discord->Rust: ${message.author.username}: ${message.cleanContent}`);
        } else {
            const prefix = "!";
            if (message.content.startsWith(prefix)) {
                await DiscordCommandHandler.discordCommandHandler(rustplus, client, message);
            }
        }
    },
}