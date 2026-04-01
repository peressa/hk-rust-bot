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

module.exports = {
    name: 'error',
    async execute(client, error) {
        const _intlGet = (guildId, id, vars = {}) => {
            if (typeof client.intlGet === 'function') return client.intlGet(guildId, id, vars);
            return Intl.get(id, vars);
        };
        const _log = (title, msg, level = 'error') => {
            if (typeof client.log === 'function') return client.log(title, msg, level);
            console.error(`[ERROR] ${title}: ${msg}`);
        };

        _log(_intlGet(null, 'errorCap'), error, 'error');
        // NOTA: No llamamos process.exit(1) para evitar reinicios en loop.
        // El proceso se mantiene vivo y Discord.js intentará reconectar automáticamente.
    },
}
