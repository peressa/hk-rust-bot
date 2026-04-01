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

const Intl = require('../util/intl');
const DiscordTools = require('../discordTools/discordTools.js');
const PermissionHandler = require('../handlers/permissionHandler.js');

module.exports = async (client, guild, category) => {
    // helpers locales de resiliencia
    const _intlGet = (guildId, id, vars = {}) => {
        if (typeof client.intlGet === 'function') return client.intlGet(guildId, id, vars);
        return Intl.get(id, vars);
    };

    const _log = (title, msg, level = 'info') => {
        if (typeof client.log === 'function') return client.log(title, msg, level);
        Intl.log(title, msg, level);
    };

    await addTextChannel(_intlGet(guild.id, 'channelNameInformation'), 'information', client, guild, category, false, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameServers'), 'servers', client, guild, category, false, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameSettings'), 'settings', client, guild, category, false, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameCommands'), 'commands', client, guild, category, true, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameEvents'), 'events', client, guild, category, false, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameTeamchat'), 'teamchat', client, guild, category, true, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameSwitches'), 'switches', client, guild, category, false, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameSwitchGroups'), 'switchGroups', client, guild, category, false, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameAlarms'), 'alarms', client, guild, category, false, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameStorageMonitors'),
        'storageMonitors', client, guild, category, false, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameActivity'), 'activity', client, guild, category, false, _intlGet, _log);
    await addTextChannel(_intlGet(guild.id, 'channelNameTrackers'), 'trackers', client, guild, category, false, _intlGet, _log);
};

async function addTextChannel(name, idName, client, guild, parent, permissionWrite = false, _intlGet, _log) {
    const instance = client.getInstance(guild.id);

    let channel = undefined;
    if (instance.channelId[idName] !== null) {
        channel = DiscordTools.getTextChannelById(client, guild.id, instance.channelId[idName]);
    }
    if (channel === undefined) {
        channel = await DiscordTools.addTextChannel(client, guild.id, name);
        instance.channelId[idName] = channel.id;
        client.setInstance(guild.id, instance);

        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            _log(_intlGet(null, 'errorCap'),
                _intlGet(null, 'couldNotSetParent', { channelId: channel.id }), 'error');
        }
    }

    if (instance.firstTime) {
        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            _log(_intlGet(null, 'errorCap'),
                _intlGet(null, 'couldNotSetParent', { channelId: channel.id }), 'error');
        }
    }

    const perms = PermissionHandler.getPermissionsReset(client, guild, permissionWrite);

    try {
        await channel.permissionOverwrites.set(perms);
    }
    catch (e) {
        /* Ignore */
    }

    /* Currently, this halts the entire application... Too lazy to fix...
       It is possible to just remove the channels and let the bot recreate them with correct name language */
    //channel.setName(name);

    channel.lockPermissions();
}