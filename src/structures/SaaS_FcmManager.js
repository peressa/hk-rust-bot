const PushReceiverClient = require('@liamcottle/push-receiver/src/client');
const { register: registerGCM } = require('@liamcottle/push-receiver/src/gcm');
const db = require('./database');
const crypto = require('crypto');
const axios = require('axios');

class FcmManager {
    constructor(discordBot) {
        this.discordBot = discordBot;
        this.fcmListeners = new Map();
    }

    // Registra un nuevo dispositivo "virtual" GCM para el usuario que recién vincula su cuenta
    // Omitimos FCM (404) porque no es necesario para el socket MCS del bot.
    async registerNewDevice(steamId) {
        try {
            console.log(`[FCM] Generando credenciales Push-Receiver para usuario ${steamId}...`);
            
            // 1. Generar credenciales GCM
            // Usamos un appId más estándar para evitar PHONE_REGISTRATION_ERROR
            const appId = `org.facepunch.rust.companion`;
            
            console.log(`[FCM] Solicitando nuevo AndroidID a Google (Check-In)...`);
            
            // Para un registro NUEVO, androidId y securityToken DEBEN ser undefined
            // Esto evita el Error 401 (bad security token)
            const subscription = await registerGCM(undefined, undefined, appId);
            
            const androidId = subscription.androidId.toString();
            const securityToken = subscription.securityToken.toString();

            const credentials = {
                gcm: {
                    androidId: androidId,
                    securityToken: securityToken
                }
            };
            
            // 3. Vincular el dispositivo virtual con Facepunch (Rust+ API)
            await this.registerDeviceWithFacepunch(steamId, androidId, subscription.token);

            // Guardar en base de datos
            db.updateUserFCM(steamId, credentials);
            
            // Arrancar el listener inmediatamente
            this.startListenerForUser(steamId, credentials);
            
            return credentials;
        } catch (error) {
            console.error(`[FCM] Error al registrar dispositivo para ${steamId}:`, error);
            throw error;
        }
    }

    // Arranca todos los listeners de los usuarios que tienen fcm_credentials activas
    startAllListeners() {
        const users = db.db.prepare('SELECT * FROM users WHERE fcm_credentials IS NOT NULL').all();
        console.log(`[FCM] Arrancando listeners Push para ${users.length} usuarios...`);
        
        for (const user of users) {
            try {
                const creds = JSON.parse(user.fcm_credentials);
                this.startListenerForUser(user.steam_id, creds);
            } catch (e) {
                console.error(`[FCM] Credenciales inválidas para ${user.steam_id}`);
            }
        }
    }

    startListenerForUser(steamId, credentials) {
        // Limpiar si ya existe
        if (this.fcmListeners.has(steamId)) {
            this.fcmListeners.get(steamId).destroy();
        }

        const client = new PushReceiverClient(credentials.gcm.androidId, credentials.gcm.securityToken);
        
        client.on('ON_DATA_RECEIVED', async (data) => {
            try {
                await this.handlePushData(steamId, data);
            } catch (error) {
                console.error(`[FCM] Error procesando notificación para ${steamId}:`, error);
            }
        });

        client.connect();
        this.fcmListeners.set(steamId, client);
        console.log(`[FCM] Listener activo para SteamID: ${steamId}`);
    }

    async handlePushData(steamId, data) {
        const appData = data.appData;
        if (!appData) return;

        const title = appData.find(item => item.key === 'title')?.value;
        const message = appData.find(item => item.key === 'message')?.value;
        const channelId = appData.find(item => item.key === 'channelId')?.value;
        const bodyRaw = appData.find(item => item.key === 'body')?.value;

        if (!bodyRaw) return;
        const body = JSON.parse(bodyRaw);

        // ============================================
        // 1. EMPAREJAMIENTO DE SERVIDOR (Zero-Friction)
        // ============================================
        if (channelId === 'pairing' && body.type === 'server') {
            console.log(`[FCM ZERO-FRICTION] Solicitud de Pairing recibida. Rust IP: ${body.ip}:${body.port}`);
            
            // Upsert el servidor directamente a la base de datos de SaaS (Multiplexado)
            db.upsertRustServer(steamId, body.ip, body.port, `${body.ip}-${body.port}`, body.playerToken);
            console.log(`[FCM ZERO-FRICTION] Token interceptado. Servidor Guardado: ${body.ip}`);

            // Buscamos si el usuario tiene un Discord asociado para conectar el websocket en tiempo real
            const guilds = db.getGuildsByOwner(steamId);
            if (guilds && guilds.length > 0) {
                const guildId = guilds[0].guild_id;
                console.log(`[FCM ZERO-FRICTION] Auto-Conectando Rust+ para Guild: ${guildId}`);
                this.discordBot.createRustplusInstance(guildId, body.ip, body.port, body.playerId, body.playerToken);
            }
            
            // Notificar Mágicamente al Frontend si el usuario lo tiene abierto
            const sseRes = global.sseClients ? global.sseClients.get(steamId) : null;
            if (sseRes) {
                sseRes.write(`data: ${JSON.stringify({ type: 'server_paired', serverIp: body.ip, serverPort: body.port })}\n\n`);
            }
        }

        // ============================================
        // 2. ALERTAS AVANZADAS (Smart Alarms)
        // ============================================
        if (channelId === 'alarm' && body.type === 'alarm') {
            await this.routeAlertToDiscord(steamId, `🚨 ALARMA: ${title}`, message);
        }
        
        // Soporte de plugins Anti-Raid estándar de uMod (Raid Alarm enviada como texto puro)
        if (channelId === 'alarm' && (!body.type || title.includes("raided") || title.includes("Raid"))) {
             await this.routeAlertToDiscord(steamId, `⚔️ RAID DETECTADO: ${title}`, message);
        }

        // ============================================
        // 3. LIVE COMBAT LOG (SSE WEB KILLFEED)
        // ============================================
        if (channelId === 'player' && body.type === 'death') {
             // title = "You were killed by X" or message = "X killed you"
             // Inyectar el payload en la conexión viva de EventSource del navegador asociado a este SteamID.
             const sseRes = global.sseClients ? global.sseClients.get(steamId) : null;
             if (sseRes) {
                 const payload = {
                     targetName: body.targetName || "Jugador",
                     killerName: title.replace("You were killed by ", "") || "Desconocido",
                     message: message,
                     weapon: body.message || "Arma", 
                     timestamp: new Date().toLocaleTimeString()
                 };
                 // El formato obligatorio SSE: data: {...}\n\n
                 sseRes.write(`data: ${JSON.stringify({ type: 'kill', payload })}\n\n`);
             }
             
             // Y mandar la alerta estandar a Discord igual (opcional) pero el combat log web es magia
             // await this.routeAlertToDiscord(steamId, `💀 Muerte: ${title}`, message);
        }
    }

    async routeAlertToDiscord(steamIdOwner, embedTitle, embedDesc) {
        const guilds = db.getGuildsByOwner(steamIdOwner);
        if (!guilds || guilds.length === 0) return;

        for (const guildData of guilds) {
            if (guildData.alert_channel_id) {
                try {
                    const discordGuild = await this.discordBot.guilds.fetch(guildData.guild_id).catch(()=>null);
                    if(!discordGuild) continue;
                    
                    const channel = await discordGuild.channels.fetch(guildData.alert_channel_id).catch(()=>null);
                    if(channel) {
                        const { EmbedBuilder } = require('discord.js');
                        const embed = new EmbedBuilder()
                            .setColor('#ef4444')
                            .setTitle(embedTitle)
                            .setDescription(embedDesc)
                            .setTimestamp();
                        
                        await channel.send({ content: "@here", embeds: [embed] });
                    }
                } catch (e) {
                    console.error("[FCM] Error enrutando alerta a Discord:", e);
                }
            }
        }
    }
    // ============================================
    // REGISTRO EN FACEPUNCH (VINCULACIÓN REAL)
    // ============================================
    async registerDeviceWithFacepunch(steamId, androidId, pushToken) {
        try {
            console.log(`[FCM] Vinculando AndroidID ${androidId} con Facepunch para SteamID ${steamId}...`);
            
            // Endpoint oficial de Rust+ para registrar dispositivos de notificaciones
            const response = await axios.post('https://companion-rust.facepunch.com/api/push/register', {
                ServerType: "Official",
                DeviceId: androidId.toString(),
                DeviceName: "HK Rust Bot",
                PushService: 1, // 1 = GCM/FCM
                PushToken: pushToken,
                SteamId: steamId.toString()
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Rust/2507 CFNetwork/1410.0.3 Darwin/22.6.0' 
                },
                timeout: 10000
            });

            if (response.status === 200) {
                console.log(`[FCM] Vinculación con Facepunch EXITOSA para ${steamId}`);
            } else {
                console.warn(`[FCM] Facepunch respondió con status ${response.status}:`, response.data);
            }
        } catch (error) {
            console.error(`[FCM] Error crítico vinculando con Facepunch para ${steamId}:`, error.message);
            // No lanzamos el error para no bloquear el proceso, pero lo logueamos
        }
    }
}

module.exports = FcmManager;
