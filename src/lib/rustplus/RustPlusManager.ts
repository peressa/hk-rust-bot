import RustPlus from "@liamcottle/rustplus.js";
import { EventEmitter } from "events";

export interface ServerConnection {
  ip: string;
  port: string;
  playerId: string;
  playerToken: string;
  useProxy?: boolean;
}

class RustPlusManager extends EventEmitter {
  private connections: Map<string, any> = new Map();
  private connecting: Map<string, Promise<any>> = new Map(); // Prevent double-connect
  private chatHistory: Map<string, any[]> = new Map(); // steamId-ip -> messages[]
  private ready: Map<string, boolean> = new Map(); // Track if connection is ready

  async connect(steamId: string, connection: ServerConnection, isRetry = false): Promise<any> {
    const key = `${steamId}-${connection.ip}`;

    // If already connected and ready, return existing connection
    if (this.connections.has(key) && this.ready.get(key)) {
      return this.connections.get(key);
    }

    // If currently connecting, wait for that promise
    if (this.connecting.has(key)) {
      return this.connecting.get(key);
    }

    // Start a new connection process
    const connectPromise = this.internalConnect(steamId, connection, isRetry);
    this.connecting.set(key, connectPromise);
    return connectPromise;
  }

  private internalConnect(steamId: string, connection: ServerConnection, isRetry = false): Promise<any> {
    const key = `${steamId}-${connection.ip}`;
    
    return new Promise<any>((resolve, reject) => {
      console.log(`[RustPlus] Attempting ${connection.useProxy ? 'PROXY' : 'DIRECT'} connection to ${connection.ip}`);
      
      const rustplus = new RustPlus(
        connection.ip,
        parseInt(connection.port), 
        connection.playerId.toString(), 
        parseInt(connection.playerToken),
        connection.useProxy || false
      );

      const timeout = setTimeout(async () => {
        rustplus.disconnect();
        this.connecting.delete(key);
        
        if (!connection.useProxy && !isRetry) {
          console.log(`[RustPlus] Timeout on direct. Fallback to Proxy for ${connection.ip}...`);
          try {
            // Sequential attempt, not recursive through public connect to avoid deadlock
            const proxyConn = await this.internalConnect(steamId, { ...connection, useProxy: true }, true);
            resolve(proxyConn);
          } catch (e) {
            reject(new Error(`Connection timeout even via Proxy for ${connection.ip}`));
          }
        } else {
          reject(new Error(`Connection timeout after 30s for ${connection.ip}`));
        }
      }, 30000); 

      rustplus.on("connected", () => {
        clearTimeout(timeout);
        console.log(`[RustPlus] SUCCESS: ${connection.useProxy ? 'PROXY' : 'DIRECT'} connected to ${connection.ip}`);
        this.ready.set(key, true);
        this.connections.set(key, rustplus);
        this.connecting.delete(key);
        this.emit("connected", { steamId, ip: connection.ip, useProxy: !!connection.useProxy });
        resolve(rustplus);
      });

      rustplus.on("message", (message: any) => {
        if (message.broadcast?.teamChat) {
          const teamKey = `${steamId}-${connection.ip}`;
          const chatMsg = message.broadcast.teamChat.message;
          const history = this.chatHistory.get(teamKey) || [];
          
          history.push({ ...chatMsg, time: Date.now() });
          if (history.length > 100) history.shift();
          this.chatHistory.set(teamKey, history);

          if (chatMsg.message.startsWith("!")) {
            this.handleTeamCommand(steamId, connection.ip, chatMsg.message);
          }
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
  }

  private async handleTeamCommand(steamId: string, ip: string, cmd: string) {
    const key = `${steamId}-${ip}`;
    const rustplus = this.connections.get(key);
    if (!rustplus) return;

    const command = cmd.toLowerCase().trim();
    
    try {
      if (command === "!time") {
        const timeResp = await this.sendRequest(steamId, ip, { getTime: {} });
        const t = timeResp.response.time;
        rustplus.sendTeamMessage(`🕒 Hora HK: ${t.time} (${t.dayLengthMinutes}m día / ${t.nightLengthMinutes}m noche)`);
      } else if (command === "!pop") {
        const infoResp = await this.sendRequest(steamId, ip, { getInfo: {} });
        const i = infoResp.response.info;
        rustplus.sendTeamMessage(`📊 Pop HK: ${i.players}/${i.maxPlayers} (Cola: ${i.queued || 0})`);
      } else if (command === "!upkeep") {
        rustplus.sendTeamMessage(`🏠 Mantenimiento: Consulta el mapa interactivo de HK Rust para ver el tiempo real.`);
      }
    } catch (err) {
      console.error("[RustPlus Command Error]:", err);
    }
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
    console.log(`[RustPlus] Requesting MAP for ${ip} (Timeout: 90s)...`);
    return this.sendRequest(steamId, ip, { getMap: {} }, 90000); // Rustoria needs more time
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

  // Diagnostic helper
  public async checkProtos(): Promise<any> {
    const fs = require('fs');
    const path = require('path');
    const results: any = {
      cwd: process.cwd(),
      dirname: __dirname,
      files: {}
    };

    const routes = [
      path.resolve(__dirname, '../../node_modules/@liamcottle/rustplus.js/rustplus.proto'),
      path.resolve(__dirname, '../../node_modules/@liamcottle/push-receiver/src/gcm/checkin.proto'),
      path.resolve(__dirname, '../../node_modules/@liamcottle/push-receiver/src/gcm/android_checkin.proto'),
      path.resolve(__dirname, '../../node_modules/@liamcottle/push-receiver/src/mcs.proto'),
      // Fallback relative to ROOT
      '/ROOT/node_modules/@liamcottle/rustplus.js/rustplus.proto',
      path.join(process.cwd(), 'node_modules/@liamcottle/rustplus.js/rustplus.proto')
    ];

    routes.forEach(r => {
      results.files[r] = fs.existsSync(r);
    });

    console.log("[RustPlus Diagnostic]:", JSON.stringify(results, null, 2));
    return results;
  }
}

// Singleton for the whole app (persists across requests in Next.js)
declare global {
  var _rustPlusManager: RustPlusManager | undefined;
}

export const rustPlusManager: RustPlusManager = global._rustPlusManager ?? (global._rustPlusManager = new RustPlusManager());

// Initial check on load
rustPlusManager.checkProtos().catch(console.error);
