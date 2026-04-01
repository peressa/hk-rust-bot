import axios from 'axios';
const { checkIn: gcmCheckIn } = require('@liamcottle/push-receiver/src/gcm');
const querystring = require('querystring');
const crypto = require('crypto');

async function runPairing(steamId: string, authToken: string) {
    console.log(`[PAIRING-TOOL] Iniciando registro FCM para ${steamId}...`);
    
    try {
        // 1. GCM Check-In
        console.log(`[PAIRING-TOOL] Paso 1: Check-In con Google...`);
        const checkinResponse = await gcmCheckIn(undefined, undefined);
        const androidId = checkinResponse.androidId.toString();
        const securityToken = checkinResponse.securityToken.toString();
        console.log(`[PAIRING-TOOL] Check-In exitoso. AndroidID: ${androidId}`);

        // 2. GCM Register (Rust+ SenderID)
        console.log(`[PAIRING-TOOL] Paso 2: Registro GCM con Rust+ SenderID...`);
        const rustSenderId = '976529667804';
        const appId = 'com.facepunch.rust.companion';

        const registerResponse = await axios.post('https://android.clients.google.com/c2dm/register3', 
            querystring.stringify({
                app: appId,
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

        if (registerResponse.data.includes('Error=')) {
            console.error(`[PAIRING-TOOL] ERROR DE REGISTRO GOOGLE: ${registerResponse.data}`);
            if (registerResponse.data.includes('PHONE_REGISTRATION_ERROR')) {
                console.error(`[PAIRING-TOOL] TIP: Google bloqueó el registro. Espera unos minutos y cambia de IP.`);
            }
            return;
        }

        const pushToken = registerResponse.data.split('=')[1]?.trim();
        console.log(`[PAIRING-TOOL] Token FCM obtenido: ${pushToken.substring(0, 10)}...`);

        // 3. Facepunch Register
        console.log(`[PAIRING-TOOL] Paso 3: Vinculación con Facepunch...`);
        const hexDeviceId = BigInt(androidId).toString(16).padStart(16, '0');
        
        try {
            const fpResponse = await axios.post('https://companion-rust.facepunch.com/api/push/register', {
                serverType: "Official",
                deviceId: hexDeviceId,
                deviceName: "HK Pairing Tool",
                pushService: 1,
                pushToken: pushToken,
                steamId: steamId,
                authToken: authToken
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken,
                    'User-Agent': 'Rust/2507 (Android; 11; Google Pixel 4) CFNetwork/1410.0.3'
                },
                timeout: 10000
            });

            if (fpResponse.status === 200) {
                console.log(`[PAIRING-TOOL] EXITO: Vinculación con Facepunch completada.`);
                console.log(`[PAIRING-TOOL] Credenciales a guardar en base de datos:`);
                console.log(JSON.stringify({
                    gcm: { androidId, securityToken }
                }, null, 2));
            }
        } catch (err: any) {
             console.error(`[PAIRING-TOOL] ERROR FACEPUNCH (${err.response?.status || 'SIN RESPUESTA'}):`);
             console.error(err.response?.data || err.message);
             if (err.response?.status === 500) {
                 console.warn(`[PAIRING-TOOL] ADVERTENCIA: La cuenta ${steamId} parece no tener STEAM GUARD activo.`);
             }
        }

    } catch (e: any) {
        console.error(`[PAIRING-TOOL] ERROR CRÍTICO: ${e.message}`);
    }
}

// Ejecución interactiva
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Uso: npx ts-node src/util/PairingTool.ts <SteamID> <AuthToken>");
    process.exit(1);
}

runPairing(args[0], args[1]);
