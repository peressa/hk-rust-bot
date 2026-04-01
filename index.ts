require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// PRE-BOOT RESILIENCE: Parche de Prototipo para Discord.Client
// Inyectamos intlGet directamente en el prototipo de Discord ANTES de cargar cualquier otra clase.
const Discord = require('discord.js');
const IntlHelper = require('./src/util/intl');
if (typeof Discord.Client.prototype.intlGet !== 'function') {
    Discord.Client.prototype.intlGet = function(guildId: any, id: string, variables: any = {}) {
        try {
            const intl = (this as any).guildIntl?.[guildId] || (this as any).botIntl || (this as any).enIntl;
            if (intl) {
                return intl.formatMessage({ id: id, defaultMessage: (this as any).enMessages?.[id] || id }, variables);
            }
            return IntlHelper.get(id, variables);
        } catch (e) {
            return IntlHelper.get(id, variables); 
        }
    };
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

process.on('unhandledRejection', error => {
    console.error('[Unhandled Rejection]', error);
});
