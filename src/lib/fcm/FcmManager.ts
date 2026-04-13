import axios from "axios";
import { v4 as uuidv4 } from "uuid";
// @ts-ignore
import AndroidFCM from "@liamcottle/push-receiver/src/android/fcm";
// @ts-ignore
import PushReceiverClient from "@liamcottle/push-receiver/src/client";
import { saveServer, saveEntity } from "../db";
import db from "../db";

const FCM_CONFIG = {
  apiKey: "AIzaSyB5y2y-Tzqb4-I4Qnlsh_9naYv_TD8pCvY",
  projectId: "rust-companion-app",
  gcmSenderId: "976529667804",
  gmsAppId: "1:976529667804:android:d6f1ddeb4403b338fea619",
  androidPackageName: "com.facepunch.rust.companion",
  androidPackageCert: "E28D05345FB78A7A1A63D70F4A302DBF426CA5AD",
};

import { listenerRegistry } from "./ListenerRegistry";
import { worldToGrid } from "../rustplus/coordUtils";

export class FcmManager {
  public static debugLogs: any[] = [];

  static async register(steamId: string, authToken: string) {
    console.log(`[FCM] Registering for ${steamId}`);
    
    // Generate a permanent DeviceId for this user
    const deviceId = `rust-web-${uuidv4().substring(0, 8)}`;
    
    const fcmCredentials = await AndroidFCM.register(
      FCM_CONFIG.apiKey,
      FCM_CONFIG.projectId,
      FCM_CONFIG.gcmSenderId,
      FCM_CONFIG.gmsAppId,
      FCM_CONFIG.androidPackageName,
      FCM_CONFIG.androidPackageCert
    );

    // PushKind 1 is for native Android (FCM/GCM)
    await axios.post("https://companion-rust.facepunch.com:443/api/push/register", {
      AuthToken: authToken,
      DeviceId: deviceId,
      PushKind: 1, 
      PushToken: fcmCredentials.fcm.token,
    });

    console.log(`[FCM] Successfully registered native FCM with Facepunch for ${steamId}. Device: ${deviceId}`);

    // Save credentials to DB
    const stmt = db.prepare("INSERT OR REPLACE INTO fcm_keys (steamId, keys, deviceId) VALUES (?, ?, ?)");
    stmt.run(steamId, JSON.stringify({
      fcm_credentials: fcmCredentials,
      rustplus_auth_token: authToken,
    }), deviceId);

    return { fcmCredentials, deviceId };
  }

  static isListening(steamId: string): boolean {
    return listenerRegistry.isListening(steamId);
  }

  /**
   * Carga y activa todos los listeners de FCM guardados en la base de datos.
   * Esto permite que la inteligencia se reanude automáticamente tras un despliegue
   * sin intervención del usuario.
   */
  static async initAllListeners() {
    console.log("[FCM] Iniciando recuperación masiva de listeners tácticos...");
    try {
      const rows = db.prepare("SELECT steamId FROM fcm_keys").all() as any[];
      console.log(`[FCM] Se encontraron ${rows.length} identidades registradas.`);

      for (const row of rows) {
        try {
          // Ya hay validación de duplicados dentro de listen()
          await this.listen(row.steamId, (data) => {
            console.log(`[FCM AutoStart] Señal recibida para ${row.steamId}`);
          });
        } catch (err: any) {
          console.error(`[FCM AutoStart] Error iniciando listener para ${row.steamId}:`, err.message);
        }
      }
      console.log("[FCM] Recuperación de inteligencia completada.");
    } catch (err) {
      console.error("[FCM] Error crítico en initAllListeners:", err);
    }
  }

  private static async getExpoPushToken(fcmToken: string) {
    const response = await axios.post("https://exp.host/--/api/v2/push/getExpoPushToken", {
      type: "fcm",
      deviceId: uuidv4(),
      development: false,
      appId: "com.facepunch.rust.companion",
      deviceToken: fcmToken,
      projectId: "49451aca-a822-41e6-ad59-955718d0ff9c",
    });
    return response.data.data.expoPushToken;
  }

  static async listen(steamId: string, onNotification: (data: any) => void) {
    // Check registry first
    if (listenerRegistry.isListening(steamId)) {
      console.log(`[FCM] Listener already active for ${steamId}. Skipping...`);
      return;
    }

    const stmt = db.prepare("SELECT keys, deviceId FROM fcm_keys WHERE steamId = ?");
    const row = stmt.get(steamId) as any;
    if (!row) {
      console.warn(`[FCM] Skipping listen: FCM not registered for user ${steamId}.`);
      return null;
    }

    const config = JSON.parse(row.keys);
    const deviceId = row.deviceId || `rust-web-${steamId}`; // Fallback if old
    const client = new PushReceiverClient(
      config.fcm_credentials.gcm.androidId,
      config.fcm_credentials.gcm.securityToken,
      []
    );

    client.on("ON_DATA_RECEIVED", async (data: any) => {
      console.log(`[FCM RAW] Received raw data for ${steamId}:`, JSON.stringify(data));
      
      // Blackbox for Live Debugging
      FcmManager.debugLogs.unshift({ timestamp: Date.now(), data });
      if (FcmManager.debugLogs.length > 20) FcmManager.debugLogs.pop();

      let payload = data.data || {};

      // EXTREMELY IMPORTANT: Facepunch often sends data in an appData array
      if (Array.isArray(data.appData)) {
        data.appData.forEach((item: any) => {
          payload[item.key] = item.value;
        });
        console.log(`[FCM] Extracted data from appData array`);
      }

      if (data.data && data.data.body) {
        try {
          const bodyJson = JSON.parse(data.data.body);
          payload = { ...payload, ...bodyJson };
          console.log(`[FCM] Parsed body successfully`);
        } catch (e) {
          console.warn("[FCM] Data body is not JSON, treating as raw string:", data.data.body);
          // If body is NOT JSON but contains server info as a string, we might need a parser here
          // For now, let's look for known fields in the flat data object
        }
      }

      // Normalize keys to lowercase to be case-insensitive
      const normalizedPayload: any = {};
      Object.keys(payload).forEach(key => {
        normalizedPayload[key.toLowerCase()] = payload[key];
      });

      console.log(`[FCM] Normalized Payload:`, JSON.stringify(normalizedPayload));
      
      const ip = normalizedPayload.ip || normalizedPayload.serverip;
      const port = normalizedPayload.port || normalizedPayload.serverport;
      
      // Solo es pairing si tiene PLAYERTOKEN. Si no, es una notificación normal (muerte, evento, etc)
      const isServerPairing = 
        (normalizedPayload.type === "server" || (ip && port)) && 
        normalizedPayload.playertoken && 
        normalizedPayload.playertoken !== "undefined";
      
      const isEntityPairing = normalizedPayload.type === "entity" || normalizedPayload.entityid;
      const isDeathNotify = normalizedPayload.type === "death" || normalizedPayload.gcm_notification_title?.toLowerCase().includes("killed");

      // Si es muerte, NO es pairing de servidor aunque traiga IP/Port (a menos que traiga token explícito)
      if (isDeathNotify && !normalizedPayload.playertoken) {
         // Continuar a la lógica de muerte
      } else if (isServerPairing) {
        const server = {
          ip: ip,
          port: port?.toString(),
          playerId: (normalizedPayload.playerid || normalizedPayload.player_id)?.toString(),
          playerToken: (normalizedPayload.playertoken || normalizedPayload.player_token)?.toString(),
          name: normalizedPayload.servername || normalizedPayload.name || payload.body || "Servidor Rust+",
          steamId: steamId
        };
        
        console.log(`[FCM] Detected Server Pairing! Info:`, server);
        
        try {
          saveServer(server);
          console.log(`[FCM] SUCCESS: Server saved correctly: ${server.name}`);

          // Enviar Webhook
          const dbModule = require('@/lib/db');
          const servers = dbModule.getServers(steamId);
          // Find the just saved or existing server to get webhook if it existed
          const existing = servers.find((s:any) => s.ip === ip);
          if (existing && (existing.discordWebhook || existing.discordChannelId)) {
            const { DiscordManager } = require('@/lib/discord/DiscordManager');
            DiscordManager.sendPairing({ 
              webhookUrl: existing.discordWebhook, 
              channelId: existing.discordChannelId 
            }, existing.name, ip, server.port);
          }

        } catch (err) {
          console.error(`[FCM] DATABASE ERROR: Failed to save server:`, err);
        }
      } else if (isDeathNotify) {
        console.log(`[FCM] Detected Death Notification!`);
        try {
          const dbModule = require('@/lib/db');
          const x = parseFloat(normalizedPayload.x) || 0;
          const y = parseFloat(normalizedPayload.y) || 0;
          const killer = normalizedPayload.targetname || "Unknown";
          
          if (ip) {
            const isNew = dbModule.saveDeathMarker(steamId, ip, killer, x, y);
            if (isNew) {
               console.log(`[FCM] Muerte registrada en ${ip} por ${killer}`);
               
               // Alerta en el Chat de Equipo
               const servers = dbModule.getServers(steamId);
               const server = servers.find((s: any) => s.ip === ip);
               const mapSize = server?.mapSize || 4000;
               const grid = worldToGrid(x, y, mapSize);
               
               const { rustPlusManager } = await import("../rustplus/RustPlusManager");
               rustPlusManager.sendTeamMessage(steamId, ip, 
                 `:exclamation: ¡${killer} te ha eliminado en ${grid}! (Coord: ${Math.round(x)},${Math.round(y)})`
               ).catch(e => console.warn("[FCM] No se pudo enviar el chat de muerte", e));

               // Alerta en Discord
               if (server && (server.discordWebhook || server.discordChannelId)) {
                 const { DiscordManager } = require('@/lib/discord/DiscordManager');
                 DiscordManager.sendDeath({
                   webhookUrl: server.discordWebhook,
                   channelId: server.discordChannelId
                 }, killer === "Unknown" ? "Un enemigo" : killer, x, y, server.name, "Ti mismo");
               }
            }
          }
        } catch(err) {
          console.warn("[FCM] Error procesando notificación de muerte", err);
        }
      } else if (isEntityPairing) {
        const entity = {
          steamId: steamId,
          serverId: ip || "unknown", 
          entityId: normalizedPayload.entityid,
          entityType: parseInt(normalizedPayload.entitytype) || 0,
          name: normalizedPayload.entityname || normalizedPayload.name || "Dispositivo Rust+",
          value: normalizedPayload.value === "true",
          capacity: parseFloat(normalizedPayload.capacity) || 0
        };
        
        console.log(`[FCM] Detected Entity Update/Pairing! Info:`, entity);

        try {
          saveEntity(entity);
          
          // Alerta de Batería Baja
          if (entity.capacity > 0 && entity.capacity < 10) {
            const dbModule = require('@/lib/db');
            const server = dbModule.default.prepare("SELECT * FROM servers WHERE id = ?").get(entity.serverId) as any;
            if (server && (server.discordWebhook || server.discordChannelId)) {
                const { DiscordManager } = require('@/lib/discord/DiscordManager');
                DiscordManager.sendAlarm({
                  webhookUrl: server.discordWebhook,
                  channelId: server.discordChannelId
                }, "⚠️ BATERÍA CRÍTICA", `La batería "${entity.name}" está al ${Math.round(entity.capacity)}%. ¡Recarga pronto!`, server.name);
            }
          }

          console.log(`[FCM] SUCCESS: Entity saved correctly: ${entity.name}`);
        } catch (err) {
          console.error(`[FCM] DATABASE ERROR: Failed to save entity:`, err);
        }
      } else if (normalizedPayload.type === "alarm" || normalizedPayload.channelid === "alarm") {
        console.log(`[FCM] Detected Smart Alarm!`);
        try {
          const dbModule = require('@/lib/db');
          const servers = dbModule.getServers(steamId);
          const serverName = normalizedPayload.servername || "Servidor Desconocido";
          // We can try to find the server just by matching name or assuming the active one
          const matchingServer = servers.find((s:any) => s.name === serverName) || servers[0];
          
          if (matchingServer && (matchingServer.discordWebhook || matchingServer.discordChannelId)) {
            const { DiscordManager } = require('@/lib/discord/DiscordManager');
            const alarmTitle = payload.title || "Alarma Inteligente Activada";
            const alarmMsg = payload.body || "Se ha activado una alarma en tu base.";
            DiscordManager.sendAlarm({
              webhookUrl: matchingServer.discordWebhook,
              channelId: matchingServer.discordChannelId
            }, alarmTitle, alarmMsg, matchingServer.name);
          }
        } catch(err) {
          console.warn("[FCM] Error enviando alarma a Discord", err);
        }
      } else {
        console.log(`[FCM] Notification ignored. Type: ${normalizedPayload.type || 'unknown'}. Keys: ${Object.keys(normalizedPayload).join(',')}`);
      }

      if (onNotification) onNotification(data);
    });

    await client.connect();
    
    // Register in global registry
    listenerRegistry.setListener(steamId, client);
    
    return client;
  }
}
