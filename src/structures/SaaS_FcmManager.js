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
        this.inProgressRegistrations = new Set();
    }

    // Registra un nuevo dispositivo "virtual" GCM para el usuario que recién vincula su cuenta
    async registerNewDevice(steamId) {
        if (this.inProgressRegistrations.has(steamId)) {
            console.warn(`[FCM] Registro ya en curso para ${steamId}. Ignorando duplicado.`);
            return;
        }

        try {
            this.inProgressRegistrations.add(steamId);
            
            // Ver si ya tenemos identidad GCM guardada para este usuario
            const user = db.getUser(steamId);
            let androidId, securityToken;

            if (user && user.fcm_credentials) {
                try {
                    const creds = JSON.parse(user.fcm_credentials);
                    if (creds.gcm && creds.gcm.androidId && creds.gcm.securityToken) {
                        androidId = creds.gcm.androidId;
                        securityToken = creds.gcm.securityToken;
                        console.log(`[FCM] Reutilizando identidad Android GCM guardada para ${steamId}: ${androidId}`);
                    }
                } catch(e) { console.warn(`[FCM] Error parseando credenciales para ${steamId}, se generarán nuevas.`); }
            }

            const appId = `com.facepunch.rust.companion`;
            if (!androidId || !securityToken) {
                console.log(`[FCM] Generando NUEVA identidad Push-Receiver para usuario ${steamId}...`);
                // 1. Generar credenciales GCM (Check-In)
                console.log(`[FCM] Solicitando nuevo AndroidID a Google (Check-In)...`);
                const checkinResponse = await gcmCheckIn(undefined, undefined);
                androidId = checkinResponse.androidId.toString();
                securityToken = checkinResponse.securityToken.toString();
                console.log(`[FCM] Check-In exitoso. AndroidID: ${androidId}.`);

                // PERSISTENCIA INMEDIATA: Guardar identidad GCM aunque falle el registro posterior (importante para reintentos)
                db.updateUserFCM(steamId, {
                    gcm: { androidId, securityToken }
                });
            }

            console.log(`[FCM] Registrando con Rust+ SenderID usando identidad: ${androidId}...`);

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
                            'X-app_ver': '2555',
                            'X-os_ver': '30',
                            'X-cliv': 'fcm-23.4.0',
                            'X-messenger_ver': '2555'
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

                    // Extraer token de forma segura (Google devuelve token=... seguido opcionalmente de otros campos y saltos de línea)
                    const parts = registerResponse.data.split('\n');
                    let pushToken = parts.find(p => p.startsWith('token='))?.split('=')[1]?.trim();
                    
                    if (pushToken && !registerResponse.data.includes('Error')) {
                        break; // Éxito
                    }
                    
                    if (registerResponse.data.includes('PHONE_REGISTRATION_ERROR')) {
                         console.error(`[FCM] ERROR CRÍTICO para ${steamId}: Google denegó el registro.`);
                         throw new Error('Google_Deny_FCM');
                    }

                    if (retry === 2) throw new Error(`Google denegó registro: ${registerResponse.data}`);
                    // Silenciamos reintentos normales para no ensuciar logs
                    await new Promise(r => setTimeout(r, 2000));
                } catch (err) {
                    if (err.message === 'Google_Deny_FCM') throw err;

                    if (retry === 2) {
                        if (err.response && err.response.status === 500) {
                            console.error(`[FCM] ERROR 500: Cuenta ${steamId} requiere Steam Guard activo.`);
                        }
                        throw err;
                    }
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            const gcmResponseParts = registerResponse.data.split('\n');
            const pushToken = gcmResponseParts.find(p => p.startsWith('token='))?.split('=')[1]?.trim();


            const credentials = {
                gcm: {
                    androidId: androidId,
                    securityToken: securityToken
                }
            };
            
            // 3. Vincular el dispositivo virtual con Facepunch (Rust+ API)
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
        } finally {
            this.inProgressRegistrations.delete(steamId);
        }
    }

    /**
     * Versión de diagnóstico que reporta progreso paso a paso para el Dashboard Visual
     */
    async debugRegisterDevice(steamId, authToken, onProgress = (step, msg, status) => {}) {
        if (this.inProgressRegistrations.has(steamId)) {
            onProgress('init', 'Ya hay un registro en curso para este usuario.', 'error');
            return;
        }

        try {
            console.log(`[FCM-V3004] Iniciando diagnóstico para SteamID: ${steamId}`);
            const user = db.getUser(steamId);
            let androidId, securityToken;

            if (user && user.fcm_credentials) {
                try {
                    const creds = JSON.parse(user.fcm_credentials);
                    if (creds.gcm && creds.gcm.androidId && creds.gcm.securityToken) {
                        androidId = creds.gcm.androidId;
                        securityToken = creds.gcm.securityToken;
                    }
                } catch(e) {}
            }

            // Paso 1: Google Check-In (Solo si no hay guardado)
            if (!androidId || !securityToken) {
                onProgress('gcm_checkin', 'Solicitando nuevo AndroidID a Google...', 'loading');
                const checkinResponse = await gcmCheckIn(undefined, undefined);
                androidId = checkinResponse.androidId.toString();
                securityToken = checkinResponse.securityToken.toString();
                onProgress('gcm_checkin', `Check-In exitoso. ID: ${androidId}`, 'success');

                // PERSISTENCIA INMEDIATA
                db.updateUserFCM(steamId, {
                    gcm: { androidId, securityToken }
                });
            } else {
                onProgress('gcm_checkin', `Reutilizando identidad GCM (V3004): ${androidId}`, 'done');
            }

            // Paso 2: Google Register (FCM Token)
            onProgress('gcm_register', 'Obteniendo Token FCM de Google...', 'loading');
            const rustSenderId = '976529667804';
            const appId = 'com.facepunch.rust.companion';
            
            const registerResponse = await axios.post('https://android.clients.google.com/c2dm/register3', 
                querystring.stringify({
                    app: appId,
                    'X-subtype': appId,
                    device: androidId,
                    sender: rustSenderId,
                    'X-scope': '*',
                    'X-app_ver': '2555',
                    'X-os_ver': '30',
                    'X-cliv': 'fcm-23.4.0',
                    'X-messenger_ver': '2555'
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

            if (registerResponse.data.includes('Error=')) {
                onProgress('gcm_register', `Google denegó el registro: ${registerResponse.data}`, 'error');
                throw new Error(`Google_Deny: ${registerResponse.data}`);
            }

            const pushToken = registerResponse.data.split('=')[1]?.trim();
            onProgress('gcm_register', 'Token FCM obtenido correctamente.', 'success');
            onProgress('fcm_trace', `ID DISPOSITIVO: ${androidId}`, 'info');

            // Paso 3: Facepunch Link
            onProgress('fp_link', 'Sincronizando con los servidores de Facepunch...', 'loading');
            
            // GENERACIÓN DE ID ESTABLE (UUID): Facepunch v3004 exige persistencia para no perder la sesión
            let stableDeviceId = user ? user.stable_device_id : null;
            if (!stableDeviceId) {
                const { randomUUID } = require('crypto');
                stableDeviceId = randomUUID();
                db.updateUserStableDeviceId(steamId, stableDeviceId);
                console.log(`[FCM-V3004] Generado nuevo stableDeviceId (UUID) para ${steamId}: ${stableDeviceId}`);
            } else {
                console.log(`[FCM-V3004] Usando stableDeviceId persistente: ${stableDeviceId}`);
            }
            
            try {
                const fpResponse = await axios.post('https://companion-rust.facepunch.com/api/push/register', {
                    serverType: "Official",
                    deviceId: stableDeviceId,
                    deviceName: "HK-RUST Pro",
                    pushService: 1, // Entero 1 (FCM Android)
                    pushToken: pushToken,
                    steamId: steamId,
                    authToken: authToken
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken,
                        'X-Rust-Companion-App-Version': '3004',
                        'X-Rust-Companion-Device-Id': stableDeviceId,
                        'User-Agent': 'Rust/3004 (Android; 13; Pixel 7)'
                    },
                    timeout: 20000 
                });

                if (fpResponse.status === 200) {
                    console.log(`[FCM-V3004] Facepunch Sync Successful. Body:`, JSON.stringify(fpResponse.data));
                    const credentials = {
                        gcm: { androidId, securityToken }
                    };

                    // Guardar en DB
                    db.updateUserFCM(steamId, {
                        ...credentials,
                        pushToken: pushToken
                    });
                    
                    // Arrancar el listener inmediatamente
                    this.startListenerForUser(steamId, credentials);

                    onProgress('fp_link', '¡Vinculación EXITOSA con Facepunch!', 'success');
                    onProgress('final', 'Tu sistema de notificaciones de Rust+ está listo y verificado.', 'success');
                }
            } catch (err) {
                let errorMsg = err.message;
                let diagnosticCode = 'UNKNOWN';

                if (err.response && err.response.data) {
                    const fpData = err.response.data;
                    console.log(`[FCM-DEBUG] Facepunch Response Data:`, fpData);
                    
                    if (typeof fpData === 'object') {
                        errorMsg = fpData.message || JSON.stringify(fpData);
                        // Mapeo detallado de errores conocidos de Facepunch
                        if (errorMsg.includes('Limited')) diagnosticCode = 'STEAM_ACCOUNT_LIMITED';
                        if (errorMsg.includes('Rust')) diagnosticCode = 'NO_RUST_OWNED';
                        if (errorMsg.includes('Guard')) diagnosticCode = 'STEAM_GUARD_REQUIRED';
                        if (errorMsg.includes('Token')) diagnosticCode = 'AUTH_TOKEN_INVALID';
                        if (errorMsg.includes('mismatch')) diagnosticCode = 'STEAM_ID_MISMATCH';
                    }
                }

                // Generar mensaje amigable basado en el diagnóstico profundo
                let humanMsg = `Error Facepunch: ${errorMsg}`;
                switch(diagnosticCode) {
                    case 'STEAM_ACCOUNT_LIMITED':
                        humanMsg = "❌ CUENTA LIMITADA: Debes gastar al menos $5 USD en Steam para usar Rust+.";
                        break;
                    case 'NO_RUST_OWNED':
                        humanMsg = "❌ JUEGO NO ENCONTRADO: Esta cuenta de Steam no posee el juego Rust.";
                        break;
                    case 'STEAM_GUARD_REQUIRED':
                        humanMsg = "❌ SEGURIDAD: Debes activar Steam Guard (autenticador móvil) en tu cuenta.";
                        break;
                    case 'AUTH_TOKEN_INVALID':
                        humanMsg = "❌ TOKEN INVÁLIDO: El token proporcionado ha expirado o es incorrecto.";
                        break;
                    case 'STEAM_ID_MISMATCH':
                        humanMsg = "❌ CONFLICTO: El token no pertenece a la cuenta de Steam actual.";
                        break;
                }

                onProgress('fp_link', humanMsg, 'error');
                onProgress('final', `Diagnóstico concluido con código: ${diagnosticCode}`, 'error');
                throw err;
            }

        } catch (error) {
            onProgress('final', `Diagnóstico fallido: ${error.message}`, 'error');
        } finally {
            this.inProgressRegistrations.delete(steamId);
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
            console.log(`[FCM] Datos recibidos para ${steamId}`);
            try {
                await this.handlePushData(steamId, data);
            } catch (error) {
                console.error(`[FCM] Error procesando notificación para ${steamId}:`, error);
            }
        });

        client.on('CONNECTED', () => {
             console.log(`[FCM] Conexión establecida con Google para ${steamId}`);
        });

        client.on('DISCONNECTED', () => {
             console.log(`[FCM] Conexión perdida con Google para ${steamId}`);
        });

        client.connect();
        this.fcmListeners.set(steamId, client);
        console.log(`[FCM] Listener activo para SteamID: ${steamId}`);
    }

    async handlePushData(steamId, data) {
        console.log(`[FCM-TRAZA] Notificación recibida para SteamID ${steamId}:`, JSON.stringify(data));
        
        // Alerta para el dashboard si hay una conexión activa de diagnóstico
        const sseRes = global.sseClients ? global.sseClients.get(steamId) : null;
        if (sseRes) {
            sseRes.write(`data: ${JSON.stringify({ step: 'fcm_trace', msg: `PUSH RECIBIDO: Channel ${data.appData?.find(i => i.key === 'channelId')?.value || 'N/A'}`, status: 'info' })}\n\n`);
        }

        const appData = data.appData;
        if (!appData) return;

        const title = appData.find(item => item.key === 'title')?.value;
        const message = appData.find(item => item.key === 'message')?.value;
        const channelId = appData.find(item => item.key === 'channelId')?.value;
        const bodyRaw = appData.find(item => item.key === 'body')?.value;

        console.log(`[FCM-TRAZA] Channel: ${channelId}, Title: ${title}`);

        if (!bodyRaw) return;
        const body = JSON.parse(bodyRaw);
        console.log(`[FCM-TRAZA] Body Type: ${body.type}`);

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
            const user = db.getUser(steamId);
            let stableDeviceId = user ? user.stable_device_id : null;
            
            if (!stableDeviceId) {
                const { randomUUID } = require('crypto');
                stableDeviceId = randomUUID();
                db.updateUserStableDeviceId(steamId, stableDeviceId);
            }

            console.log(`[FCM] Vinculando DeviceId(UUID) ${stableDeviceId} con Facepunch para SteamID ${steamId}...`);
            
            if (!authToken) {
                console.warn(`[FCM] ADVERTENCIA: No se encontró AuthToken para ${steamId}. La vinculación probablemente falle.`);
            }

            // Endpoint oficial de Rust+ para registrar dispositivos de notificaciones
            const response = await axios.post('https://companion-rust.facepunch.com/api/push/register', {
                serverType: "Official",
                deviceId: stableDeviceId,
                deviceName: "HK Rust Bot",
                pushService: 1, // 1 = GCM/FCM
                pushToken: pushToken,
                steamId: steamId.toString(),
                authToken: authToken
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken,
                    'X-Rust-Companion-App-Version': '3004',
                    'X-Rust-Companion-Device-Id': stableDeviceId,
                    'User-Agent': 'Rust/3004 (Android; 13; Pixel 7)' 
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
                
                if (error.response.status === 500) {
                    console.warn(`[FCM] >>> ADVERTENCIA IMPORTANTE: Error 500 detectado.`);
                    console.warn(`[FCM] >>> Facepunch suele rechazar vinculaciones de cuentas sin STEAM GUARD activo.`);
                    console.warn(`[FCM] >>> Por favor, activa Steam Guard (Mobile Authenticator) en la cuenta ${steamId} e intenta de nuevo.`);
                }
            }
            // No lanzamos el error duro para no romper el proceso de arranque de otros usuarios,
            // pero el usuario verá el fallo en los logs si intenta vincular.
        }
    }
}


module.exports = FcmManager;
