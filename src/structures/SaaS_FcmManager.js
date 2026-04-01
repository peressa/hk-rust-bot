const { checkIn: gcmCheckIn, register: gcmRegister } = require('@liamcottle/push-receiver/src/gcm');
const { Client: PushReceiverClient } = require('@liamcottle/push-receiver');
const db = require('./database');
const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');

class FcmManager {
    constructor(discordBot) {
        this.discordBot = discordBot;
        this.fcmListeners = new Map();
    }

    // Registra un nuevo dispositivo "virtual" GCM para el usuario que recién vincula su cuenta
    async registerNewDevice(steamId) {
        try {
            console.log(`[FCM] Generando credenciales Push-Receiver para usuario ${steamId}...`);
            
            // 1. Generar credenciales GCM
            const appId = `com.facepunch.rust.companion`;
            
            console.log(`[FCM] Solicitando nuevo AndroidID a Google (Check-In)...`);
            
            // Paso 1: Check-In (Obtener AndroidID y SecurityToken)
            const checkinResponse = await gcmCheckIn(undefined, undefined);
            const androidId = checkinResponse.androidId.toString();
            const securityToken = checkinResponse.securityToken.toString();

            console.log(`[FCM] Check-In exitoso. AndroidID: ${androidId}. Registrando con Rust+ SenderID...`);

            // Paso 2: Register con GCM usando el SenderID oficial de Rust+ (976529667804)
            const rustSenderId = '976529667804';
            
            // Reintentar el registro en caso de PHONE_REGISTRATION_ERROR transitorio
            let registerResponse;
            for (let retry = 0; retry < 3; retry++) {
                try {
                    registerResponse = await axios.post('https://android.clients.google.com/c2dm/register3', 
                        querystring.stringify({
                            app: appId, // com.facepunch.rust.companion
                            'X-subtype': appId,
                            device: androidId,
                            sender: rustSenderId,
                            'X-scope': '*',
                            'X-app_ver': '2507',
                            'X-os_ver': '30',
                            'X-cliv': 'fcm-23.1.2',
                            'X-messenger_ver': '2507'
                        }), 
                        {
                            headers: {
                                Authorization: `AidLogin ${androidId}:${securityToken}`,
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'User-Agent': 'Android-GCM/1.5',
                            },
                            timeout: 10000
                        }
                    );

                    const pushToken = registerResponse.data.split('=')[1];
                    if (pushToken && !registerResponse.data.includes('Error')) {
                        break; // Éxito
                    }
                    
                    if (retry === 2) throw new Error(`Google denegó el registro GCM: ${registerResponse.data}`);
                    console.warn(`[FCM] Reintentando registro (${retry + 1})...`);
                    await new Promise(r => setTimeout(r, 2000));
                } catch (err) {
                    if (retry === 2) throw err;
                    console.warn(`[FCM] Fallo en intento ${retry + 1}: ${err.message}`);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            const pushToken = registerResponse.data.split('=')[1];


            const credentials = {
                gcm: {
                    androidId: androidId,
                    securityToken: securityToken
                }
            };
            
            // 3. Vincular el dispositivo virtual con Facepunch (Rust+ API)
            const user = db.getUser(steamId);
            const authToken = user ? user.auth_token : null;
            await this.registerDeviceWithFacepunch(steamId, androidId, pushToken, authToken);

            // Guardar en base de datos
            db.updateUserFCM(steamId, credentials);
            
            // Arrancar el listener inmediatamente
            this.startListenerForUser(steamId, credentials);
            
            return credentials;
        } catch (error) {
            console.error(`[FCM] Error crítico al registrar dispositivo para ${steamId}:`, error.message);
            if (error.response) console.error(`[FCM] Detalle error Google:`, error.response.data);
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
    async registerDeviceWithFacepunch(steamId, androidId, pushToken, authToken = null) {
        try {
            // Facepunch espera el AndroidID en formato Hexadecimal de 16 caracteres.
            const hexDeviceId = BigInt(androidId).toString(16).padStart(16, '0');
            console.log(`[FCM] Vinculando DeviceId(Hex) ${hexDeviceId} con Facepunch para SteamID ${steamId}...`);
            
            if (!authToken) {
                console.warn(`[FCM] ADVERTENCIA: No se encontró AuthToken para ${steamId}. La vinculación probablemente falle.`);
            }

            // Endpoint oficial de Rust+ para registrar dispositivos de notificaciones
            const response = await axios.post('https://companion-rust.facepunch.com/api/push/register', {
                serverType: "Official",
                deviceId: hexDeviceId,
                deviceName: "HK Rust Bot",
                pushService: 1, // 1 = GCM/FCM
                pushToken: pushToken,
                steamId: steamId.toString(),
                authToken: authToken
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken,
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
            if (error.response) {
                console.error(`[FCM] RESPUESTA FACEPUNCH RAW (${error.response.status}):`, error.response.data);
                console.error(`[FCM] HEADERS RESPUESTA:`, error.response.headers);
            }
            // No lanzamos el error duro para no romper el proceso de arranque de otros usuarios,
            // pero el usuario verá el fallo en los logs si intenta vincular.
        }
    }
}


module.exports = FcmManager;
