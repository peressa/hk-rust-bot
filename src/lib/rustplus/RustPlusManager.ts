import RustPlus from "@liamcottle/rustplus.js";
import { EventEmitter } from "events";

export interface ServerConnection {
  ip: string;
  port: string;
  playerId: string;
  playerToken: string;
}

class RustPlusManager extends EventEmitter {
  private connections: Map<string, any> = new Map();

  async connect(steamId: string, connection: ServerConnection) {
    const key = `${steamId}-${connection.ip}`;
    if (this.connections.has(key)) {
      return this.connections.get(key);
    }

    const rustplus = new RustPlus(
      connection.ip,
      connection.port,
      connection.playerId,
      connection.playerToken
    );

    rustplus.on("connected", () => {
      console.log(`[RustPlus] Connected to ${connection.ip} for ${steamId}`);
      this.emit("connected", { steamId, ip: connection.ip });
    });

    rustplus.on("message", (message: any) => {
      this.emit("message", { steamId, ip: connection.ip, message });
    });

    rustplus.on("error", (error: any) => {
      console.error(`[RustPlus] Error on ${connection.ip}:`, error);
      this.emit("error", { steamId, ip: connection.ip, error });
    });

    rustplus.connect();
    this.connections.set(key, rustplus);
    return rustplus;
  }

  async sendRequest(steamId: string, ip: string, request: any) {
    const key = `${steamId}-${ip}`;
    const client = this.connections.get(key);
    if (!client) throw new Error("Not connected to this server");

    return new Promise((resolve) => {
      client.sendRequest(request, (response: any) => {
        resolve(response);
      });
    });
  }

  async getMap(steamId: string, ip: string) {
    return this.sendRequest(steamId, ip, { getMap: {} });
  }

  async getMapMarkers(steamId: string, ip: string) {
    return this.sendRequest(steamId, ip, { getMapMarkers: {} });
  }

  async getTeamInfo(steamId: string, ip: string) {
    return this.sendRequest(steamId, ip, { getTeamInfo: {} });
  }

  async sendTeamMessage(steamId: string, ip: string, message: string) {
    return this.sendRequest(steamId, ip, {
      sendTeamMessage: {
        message: message
      }
    });
  }

  getClient(steamId: string, ip: string) {
    return this.connections.get(`${steamId}-${ip}`);
  }
}

// Singleton for the whole app
export const rustPlusManager = new RustPlusManager();
