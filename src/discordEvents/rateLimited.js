/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    MODIFICADO: Blindaje de resiliencia contra TypeError: client.log is not a function
*/

const Intl = require('../util/intl');

module.exports = {
    name: 'rateLimited',
    async execute(client, info) {
        const _log = (t, m, l = 'info') => {
            if (typeof client.log === 'function') return client.log(t, m, l);
            if (typeof client._safeLog === 'function') return client._safeLog(t, m, l);
            Intl.log(t, m, l);
        };
        const _intlGet = (g, id, v = {}) => {
            if (typeof client.intlGet === 'function') return client.intlGet(g, id, v);
            return Intl.get(id, v);
        };
        _log(
            _intlGet(null, 'ratelimited'),
            `Timeout: ${info.timeToReset}, ` +
            `Limit: ${info.limit}, ` +
            `Method: ${info.method}, ` +
            `Path: ${info.url}, ` +
            `Route: ${info.route}, ` +
            `Global: ${info.global}`);
    },
}