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
  private connecting: Map<string, Promise<any>> = new Map(); // Prevent double-connect
  private chatHistory: Map<string, any[]> = new Map(); // steamId-ip -> messages[]
  private ready: Map<string, boolean> = new Map(); // Track if connection is ready

  async connect(steamId: string, connection: ServerConnection): Promise<any> {
    const key = `${steamId}-${connection.ip}`;

    // If already connected and ready, return existing connection
    if (this.connections.has(key) && this.ready.get(key)) {
      return this.connections.get(key);
    }

    // If currently connecting, wait for that promise
    if (this.connecting.has(key)) {
      return this.connecting.get(key);
    }

    // Start a new connection
    const connectPromise = new Promise<any>((resolve, reject) => {
      const rustplus = new RustPlus(
        connection.ip,
        connection.port,
        connection.playerId.toString(), // Mantener como string para no perder precisión de 64 bits
        parseInt(connection.playerToken)
      );

      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout to ${connection.ip} after 30s`));
        this.connecting.delete(key);
        this.ready.set(key, false);
      }, 30000); // Increased to 30s for high-pop servers like Rustoria

      rustplus.on("connected", () => {
        clearTimeout(timeout);
        console.log(`[RustPlus] Connected to ${connection.ip} for ${steamId}`);
        this.ready.set(key, true);
        this.connections.set(key, rustplus);
        this.connecting.delete(key);
        this.emit("connected", { steamId, ip: connection.ip });
        resolve(rustplus);
      });

      rustplus.on("message", (message: any) => {
        // Capture incoming team chat messages
        if (message.broadcast?.teamChat) {
          const teamKey = `${steamId}-${connection.ip}`;
          const history = this.chatHistory.get(teamKey) || [];
          history.push({
            ...message.broadcast.teamChat.message,
            time: Date.now()
          });
          if (history.length > 100) history.shift();
          this.chatHistory.set(teamKey, history);
        }
        this.emit("message", { steamId, ip: connection.ip, message });
      });

      rustplus.on("disconnected", () => {
        console.log(`[RustPlus] Disconnected from ${connection.ip}`);
        this.ready.set(key, false);
        this.connections.delete(key);
        this.connecting.delete(key);
        this.emit("disconnected", { steamId, ip: connection.ip });
      });

      rustplus.on("error", (error: any) => {
        clearTimeout(timeout);
        console.error(`[RustPlus] Error on ${connection.ip}:`, error?.message || error);
        this.ready.set(key, false);
        this.connections.delete(key);
        this.connecting.delete(key);
        this.emit("error", { steamId, ip: connection.ip, error });
        reject(error);
      });

      rustplus.connect();
    });

    this.connecting.set(key, connectPromise);
    return connectPromise;
  }

  async sendRequest(steamId: string, ip: string, request: any, timeoutMs = 10000): Promise<any> {
    const key = `${steamId}-${ip}`;
    const client = this.connections.get(key);
    if (!client || !this.ready.get(key)) {
      throw new Error(`Not connected to ${ip}`);
    }

    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Request timeout for ${JSON.stringify(request)}`)), timeoutMs);
      try {
        client.sendRequest(request, (response: any) => {
          clearTimeout(t);
          resolve(response);
        });
      } catch (e) {
        clearTimeout(t);
        reject(e);
      }
    });
  }

  async getMap(steamId: string, ip: string) {
    return this.sendRequest(steamId, ip, { getMap: {} }, 30000); // Map can be large
  }

  async getMapMarkers(steamId: string, ip: string) {
    return this.sendRequest(steamId, ip, { getMapMarkers: {} });
  }

  async getTeamInfo(steamId: string, ip: string) {
    return this.sendRequest(steamId, ip, { getTeamInfo: {} });
  }

  async sendTeamMessage(steamId: string, ip: string, message: string) {
    return this.sendRequest(steamId, ip, {
      sendTeamMessage: { message }
    });
  }

  async getEntityInfo(steamId: string, ip: string, entityId: string) {
    return this.sendRequest(steamId, ip, {
      getEntityInfo: { entityId }
    });
  }

  getChatHistory(steamId: string, ip: string) {
    return this.chatHistory.get(`${steamId}-${ip}`) || [];
  }

  getClient(steamId: string, ip: string) {
    return this.connections.get(`${steamId}-${ip}`);
  }

  isConnected(steamId: string, ip: string): boolean {
    return this.ready.get(`${steamId}-${ip}`) === true;
  }

  disconnect(steamId: string, ip: string) {
    const key = `${steamId}-${ip}`;
    const client = this.connections.get(key);
    if (client) {
      try { client.disconnect(); } catch(e) {}
      this.connections.delete(key);
      this.ready.delete(key);
      this.connecting.delete(key);
    }
  }
}

// Singleton for the whole app (persists across requests in Next.js)
declare global {
  var _rustPlusManager: RustPlusManager | undefined;
}

export const rustPlusManager: RustPlusManager = global._rustPlusManager ?? (global._rustPlusManager = new RustPlusManager());
