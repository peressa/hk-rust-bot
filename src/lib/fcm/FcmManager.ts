import axios from "axios";
import { v4 as uuidv4 } from "uuid";
// @ts-ignore
import AndroidFCM from "@liamcottle/push-receiver/src/android/fcm";
// @ts-ignore
import PushReceiverClient from "@liamcottle/push-receiver/src/client";
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

export class FcmManager {
  public static debugLogs: any[] = [];

  static async register(steamId: string, authToken: string) {
    console.log(`[FCM] Registering for ${steamId}`);
    
    const fcmCredentials = await AndroidFCM.register(
      FCM_CONFIG.apiKey,
      FCM_CONFIG.projectId,
      FCM_CONFIG.gcmSenderId,
      FCM_CONFIG.gmsAppId,
      FCM_CONFIG.androidPackageName,
      FCM_CONFIG.androidPackageCert
    );

    // PushKind 1 is for native Android (FCM/GCM)
    // PushKind 3 was for Expo, which we no longer use for direct bot reception
    await axios.post("https://companion-rust.facepunch.com:443/api/push/register", {
      AuthToken: authToken,
      DeviceId: `rust-web-${steamId}`,
      PushKind: 1, 
      PushToken: fcmCredentials.fcm.token,
    });

    console.log(`[FCM] Successfully registered native FCM with Facepunch for ${steamId}`);

    // Save credentials to DB
    const stmt = db.prepare("INSERT OR REPLACE INTO fcm_keys (steamId, keys) VALUES (?, ?)");
    stmt.run(steamId, JSON.stringify({
      fcm_credentials: fcmCredentials,
      rustplus_auth_token: authToken,
    }));

    return { fcmCredentials };
  }

  static isListening(steamId: string): boolean {
    return listenerRegistry.isListening(steamId);
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

    const stmt = db.prepare("SELECT keys FROM fcm_keys WHERE steamId = ?");
    const row = stmt.get(steamId) as any;
    if (!row) throw new Error("FCM not registered for this user");

    const config = JSON.parse(row.keys);
    const client = new PushReceiverClient(
      config.fcm_credentials.gcm.androidId,
      config.fcm_credentials.gcm.securityToken,
      []
    );

    client.on("ON_DATA_RECEIVED", (data: any) => {
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
      const isServerPairing = normalizedPayload.type === "server" || (ip && port);
      const isEntityPairing = normalizedPayload.type === "entity" || normalizedPayload.entityid;

      if (isServerPairing) {
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
          // Use global singleton db if possible or local require
          const dbModule = require("../db");
          dbModule.saveServer(server);
          console.log(`[FCM] SUCCESS: Server saved correctly: ${server.name}`);
        } catch (err) {
          console.error(`[FCM] DATABASE ERROR: Failed to save server:`, err);
        }
      } else if (isEntityPairing) {
        const entity = {
          steamId: steamId,
          serverId: ip || "unknown", 
          entityId: normalizedPayload.entityid,
          entityType: parseInt(normalizedPayload.entitytype) || 0,
          name: normalizedPayload.entityname || normalizedPayload.name || "Dispositivo Rust+"
        };
        
        console.log(`[FCM] Detected Entity Pairing! Info:`, entity);

        try {
          const dbModule = require("../db");
          dbModule.saveEntity(entity);
          console.log(`[FCM] SUCCESS: Entity saved correctly: ${entity.name}`);
        } catch (err) {
          console.error(`[FCM] DATABASE ERROR: Failed to save entity:`, err);
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
