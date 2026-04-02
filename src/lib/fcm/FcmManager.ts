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

export class FcmManager {
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

    const expoPushToken = await this.getExpoPushToken(fcmCredentials.fcm.token);
    
    await axios.post("https://companion-rust.facepunch.com:443/api/push/register", {
      AuthToken: authToken,
      DeviceId: "rust-plus-web",
      PushKind: 3,
      PushToken: expoPushToken,
    });

    // Save credentials to DB
    const stmt = db.prepare("INSERT OR REPLACE INTO fcm_keys (steamId, keys) VALUES (?, ?)");
    stmt.run(steamId, JSON.stringify({
      fcm_credentials: fcmCredentials,
      expo_push_token: expoPushToken,
      rustplus_auth_token: authToken,
    }));

    return { fcmCredentials, expoPushToken };
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
      console.log(`[FCM] Notification for ${steamId}:`, data);
      
      const payload = JSON.parse(data.data.body);
      
      if (payload.type === "server") {
        const server = {
          ip: payload.ip,
          port: payload.port,
          playerId: payload.playerId,
          playerToken: payload.playerToken,
          name: payload.serverName,
          steamId: steamId
        };
        const { saveServer } = require("../db");
        saveServer(server);
        console.log(`[FCM] Server saved: ${server.name}`);
      } else if (payload.type === "entity") {
        const entity = {
          steamId: steamId,
          serverId: payload.ip, // Use IP as temporary serverId link
          entityId: payload.entityId,
          entityType: payload.entityType,
          name: payload.entityName
        };
        const { saveEntity } = require("../db");
        saveEntity(entity);
        console.log(`[FCM] Entity saved: ${entity.name}`);
      }

      onNotification(data);
    });

    await client.connect();
    return client;
  }
}
