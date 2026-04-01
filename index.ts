require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// ==============================================================
// RESILIENCIA ABSOLUTA: Parche de Prototipo via Object.defineProperty
// Este nivel de blindaje es imposible de saltarse.
// Usamos _safeLog y _safeIntlGet como métodos de respaldo que
// SIEMPRE están disponibles en cualquier instancia de Discord.Client.
// ==============================================================
const Discord = require('discord.js');
const IntlHelper = require('./src/util/intl');

// Inyectar método de fallback _safeLog (no sobreescribe log de la clase)
if (typeof Discord.Client.prototype._safeLog !== 'function') {
    Discord.Client.prototype._safeLog = function(title: string, text: string, level: string = 'info') {
        const t = title || '';
        const msg = text || '';
        const Colors = (() => { try { return require('colors'); } catch(e) { return { green: (s: any)=>s, red: (s: any)=>s, yellow: (s: any)=>s }; } })();
        const time = new Date().toISOString().replace('T',' ').substring(0,19);
        try {
            if (level === 'error') console.log(Colors.green(`${time} `) + Colors.red(`ERROR: ${t}: ${msg}`));
            else console.log(Colors.green(`${time} `) + Colors.yellow(`${level.toUpperCase()}: ${t}: ${msg}`));
        } catch(e) { console.log(`[${level.toUpperCase()}] ${t}: ${msg}`); }
        try {
            if ((this as any).logger && typeof (this as any).logger.log === 'function') {
                const wl = level === 'error' ? 'error' : 'info';
                (this as any).logger.log({ level: wl, message: `${time} | ${t}: ${msg}` });
            }
        } catch(e) {}
    };
}

// Inyectar método de fallback _safeIntlGet 
if (typeof Discord.Client.prototype._safeIntlGet !== 'function') {
    Discord.Client.prototype._safeIntlGet = function(guildId: any, id: string, variables: any = {}) {
        try {
            const intl = (this as any).guildIntl?.[guildId] || (this as any).botIntl || (this as any).enIntl;
            if (intl) return intl.formatMessage({ id, defaultMessage: (this as any).enMessages?.[id] || id }, variables);
        } catch(e) {}
        return IntlHelper.get(id, variables);
    };
}

// CARCHE DE SEGURIDAD ABSOLUTO: Exponer helpers globales
(global as any).intlGet = (guildId: string | null, id: string, vars: any = {}) => {
    return IntlHelper.get(id, vars);
};
(global as any)._log = (title: string, msg: string, level: string = 'info') => {
    return IntlHelper.log(title, msg, level);
};

if (typeof Discord.Client.prototype.log !== 'function' || true) {
    try {
        Object.defineProperty(Discord.Client.prototype, 'log', {
            value: function(title: string, text: string, level: string = 'info') {
                return IntlHelper.log(title, text, level);
            },
            writable: false,
            configurable: false
        });
    } catch(e) {}
}
if (typeof Discord.Client.prototype.intlGet !== 'function' || true) {
    try {
        Object.defineProperty(Discord.Client.prototype, 'intlGet', {
            value: function(guildId: string | null, id: string, vars: any = {}) {
                return IntlHelper.get(id, vars);
            },
            writable: false,
            configurable: false
        });
    } catch(e) {}
}

const Fs = require('fs');
const Path = require('path');
const db = require('./src/structures/database');
const FcmManager = require('./src/structures/SaaS_FcmManager');

// Crear directorios necesarios
createMissingDirectories();

const CentralBot = require('./src/structures/DiscordBot');
const WebDashboard = require('./src/web/server');

// Iniciar servidor de Panel de Control Web
const dashboard = new WebDashboard();
dashboard.start();

// Iniciar Bot Central (SaaS Model)
const bot = new CentralBot({
    intents: [
        require('discord.js').GatewayIntentBits.Guilds,
        require('discord.js').GatewayIntentBits.GuildMessages,
        require('discord.js').GatewayIntentBits.MessageContent,
        require('discord.js').GatewayIntentBits.GuildMembers,
        require('discord.js').GatewayIntentBits.GuildVoiceStates
    ],
    retryLimit: 2,
    restRequestTimeout: 60000,
    disableEveryone: false
});

// Guardamos referencia global al bot central
(global as any).hkBot = bot;

// Guardamos referencia global al FcmManager
const fcm = new FcmManager(bot);
(global as any).fcmManager = fcm;

if (process.env.RPP_DISCORD_TOKEN) {
    bot.build(process.env.RPP_DISCORD_TOKEN).then(() => {
        console.log('[Sistema] Bot oficial encendido.');
        // Cargar todos los servidores RUST de todos los usuarios
        bot.loadAllRustServersFromDB();
        
        // Arrancar todos los listeners Push guardados en DB
        fcm.startAllListeners();
    }).catch((err: any) => {
        console.error('[Sistema] Error al encender bot oficial:', err);
    });
} else {
    console.warn('[Sistema] ADVERTENCIA: RPP_DISCORD_TOKEN no existe en .env. El bot de Discord no arrancará.');
}

function createMissingDirectories() {
    if (!Fs.existsSync(Path.join(__dirname, 'logs'))) {
        Fs.mkdirSync(Path.join(__dirname, 'logs'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'instances'))) {
        Fs.mkdirSync(Path.join(__dirname, 'instances'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'credentials'))) {
        Fs.mkdirSync(Path.join(__dirname, 'credentials'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'maps'))) {
        Fs.mkdirSync(Path.join(__dirname, 'maps'));
    }
}

process.on('unhandledRejection', (error: any) => {
    console.error('[Unhandled Rejection] Stack trace:');
    console.error(error && error.stack ? error.stack : error);
});

process.on('uncaughtException', (error: any) => {
    console.error('[UNCAUGHT EXCEPTION] Stack trace completo:');
    console.error(error && error.stack ? error.stack : error);
    // NO terminar el proceso - mantener el servidor web vivo
});
