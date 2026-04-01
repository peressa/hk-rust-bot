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

// ===================================================================
// ARQUITECTURA DE RESILIENCIA GLOBAL (HK BOT ANTI-CRASH)
// ===================================================================
const safeIntlGet = (guildId: string | null, id: string, vars: any = {}) => {
    try {
        // 1. Intentar usar el cliente global si existe y tiene el método
        const client = (global as any).client;
        if (client && typeof client._intlGetImpl === 'function') {
            return client._intlGetImpl(guildId, id, vars) || id;
        }
        // 2. Fallback al módulo base de traducción
        return IntlHelper.get(id, vars) || id;
    } catch (e) {
        return id;
    }
};

const safeLog = (title: string, text: string, level: string = 'info') => {
    try {
        const client = (global as any).client;
        if (client && typeof client._logImpl === 'function') {
            return client._logImpl(title, text, level);
        }
    } catch(e) {}
    return IntlHelper.log(title, text, level);
};

// Inyectar en Global para acceso desde cualquier módulo sin 'require'
(global as any).intlGet = safeIntlGet;
(global as any)._log = safeLog;

// Inyectar en el prototipo de Discord.Client para blindaje total
// Nota: Usamos writable: true para que DiscordBot.js pueda extenderlo si es necesario
Object.defineProperty(Discord.Client.prototype, 'intlGet', { value: safeIntlGet, writable: true, configurable: true });
Object.defineProperty(Discord.Client.prototype, 'log', { value: safeLog, writable: true, configurable: true });
// ===================================================================

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
