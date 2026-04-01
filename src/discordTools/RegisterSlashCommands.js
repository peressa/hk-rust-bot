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

const Fs = require("fs");
const Path = require('path');
const Rest = require('@discordjs/rest');
const Types = require('discord-api-types/v9');

const Config = require('../../config');

const Intl = require('../util/intl');

module.exports = async (client, guild) => {
    const commands = [];
    const commandFiles = Fs.readdirSync(Path.join(__dirname, '..', 'commands')).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        const builder = command.getData(client, guild.id);
        // Deshabilitar por defecto todos los slash commands a los recruits/everyone.
        // El Superadmin(Owner) podrá habilitarlo para roles de "Confiables" desde Integraciones en Discord nativo.
        builder.setDefaultMemberPermissions("0");
        commands.push(builder.toJSON());
    }

    const _intlGet = (guildId, id, vars = {}) => {
        return (client && typeof client.intlGet === 'function') ? client.intlGet(guildId, id, vars) : (global.intlGet || Intl.get)(guildId, id, vars);
    };

    const _log = (title, msg, level = 'info') => {
        return (client && typeof client.log === 'function') ? client.log(title, msg, level) : (global._log || console.log)(title, msg, level);
    };

    const appId = client.application?.id || client.user?.id;
    const rest = new Rest.REST({ version: '9' }).setToken(Config.discord.token);

    if (!appId) {
        _log(_intlGet(null, 'errorCap'), 'No se pudo obtener el ID de la aplicacion de Discord.', 'error');
        return;
    }

    try {
        await rest.put(Types.Routes.applicationGuildCommands(appId, guild.id), { body: commands });
        _log(_intlGet(null, 'infoCap'),
            _intlGet(null, 'slashCommandsSuccessRegister', { guildId: guild.id }));
    }
    catch (e) {
        _log(
            _intlGet(null, 'errorCap'),
            _intlGet(null, 'couldNotRegisterSlashCommands', { guildId: guild.id }) +
            _intlGet(null, 'makeSureApplicationsCommandsEnabled'),
            'error'
        );
        console.error('[SlashCommands] API Error:', e);
    }
};
