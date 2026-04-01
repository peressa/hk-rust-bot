const DiscordCommandHandler = require('../handlers/discordCommandHandler.js');
const db = require('../structures/database');

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        if (!message.guild) return; // Ignore DMs

        const guildConfig = db.getGuildConfig(message.guild.id);
        const rustplus = client.rustplusInstances[message.guild.id];

        if (message.author.bot || !rustplus || (rustplus && !rustplus.isOperational)) return;

        // Comandos via ! o canal dedicado a comandos
        // Por ahora redirigimos todos los mensajes regulares al chat si el channel_id coincide
        if (guildConfig && message.channelId === guildConfig.chat_channel_id) {
            await rustplus.sendInGameMessage(`${message.author.username}: ${message.cleanContent}`);
            client.log(client.intlGet(null, 'infoCap'), `Chat Sync Discord->Rust: ${message.author.username}: ${message.cleanContent}`);
        } else {
            // Evaluamos si es un bot command (si usa prefijo)
            const prefix = "!"; // Se puede sacar de config
            if (message.content.startsWith(prefix)) {
                await DiscordCommandHandler.discordCommandHandler(rustplus, client, message);
            }
        }
    },
}