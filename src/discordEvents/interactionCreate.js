/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

const Discord = require('discord.js');

const DiscordEmbeds = require('../discordTools/discordEmbeds');

const Intl = require('../util/intl');

module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        const _intlGet = (guildId, id, vars = {}) => {
            if (typeof client.intlGet === 'function') return client.intlGet(guildId, id, vars);
            return Intl.get(id, vars);
        };

        const instance = client.getInstance(interaction.guildId);

        /* La validación de canal/rol ahora se maneja nativamente por discord v14 integration settings */


        if (interaction.isButton()) {
            require('../handlers/buttonHandler')(client, interaction);
        }
        else if (interaction.isStringSelectMenu()) {
            require('../handlers/selectMenuHandler')(client, interaction);
        }
        else if (interaction.type === Discord.InteractionType.ApplicationCommand) {
            const command = interaction.client.commands.get(interaction.commandName);

            /* If the command doesn't exist, return */
            if (!command) return;

            try {
                await command.execute(client, interaction);
            }
            catch (e) {
                client.log(_intlGet(null, 'errorCap'), e, 'error');

                const str = _intlGet(interaction.guildId, 'errorExecutingCommand');
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                client.log(_intlGet(null, 'errorCap'), str, 'error');
            }
        }
        else if (interaction.type === Discord.InteractionType.ModalSubmit) {
            require('../handlers/modalHandler')(client, interaction);
        }
        else {
            client.log(_intlGet(null, 'errorCap'), _intlGet(null, 'unknownInteraction'), 'error');

            if (interaction.isButton()) {
                try {
                    interaction.deferUpdate();
                }
                catch (e) {
                    client.log(_intlGet(null, 'errorCap'),
                        _intlGet(null, 'couldNotDeferInteraction'), 'error');
                }
            }
        }
    },
};