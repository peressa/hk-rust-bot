import RustPlus from "@liamcottle/rustplus.js";
import * as protobuf from "protobufjs";
import { EventEmitter } from "events";
import * as db from "../db";
import { worldToGrid } from "./coordUtils";

// =====================================================================
// MONKEY PATCH: Forzar campos Opcionales en Protobufjs
// Esto evita que el error "ProtocolError: missing required '...'" 
// cierre el proceso o bloquee las promesas cuando Rust manda datos incompletos.
// =====================================================================
const originalAdd = protobuf.Type.prototype.add;
protobuf.Type.prototype.add = function (obj: any) {
  try {
    if (obj && obj.rule === "required") {
      obj.rule = "optional";
    }
  } catch (e) {
    // Silencioso
  }
  return originalAdd.call(this, obj);
};
// =====================================================================

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
  private monitorIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastMemberStates: Map<string, Map<string, any>> = new Map(); // key -> steamId -> state
  private lastMarkerStates: Map<string, any[]> = new Map(); // key -> markerIds[]
  private intelLogs: Map<string, any[]> = new Map(); // key -> intel items[]

  constructor() {
    super();
    // Prevenir que errores asíncronos de sockets o protobufs maten el proceso Next.js
    if (typeof process !== 'undefined') {
      const isRegistered = process.listeners('uncaughtException').some(l => l.name === 'rustplusUncaught');
      if (!isRegistered) {
        process.on('uncaughtException', function rustplusUncaught(error: any) {
          if (error.message?.includes('ProtocolError') || error.message?.includes('required')) {
            console.warn(`[RustPlus Manager] Ignorando Uncaught ProtocolError: ${error.message}`);
            return;
          }
          console.error('[RustPlus Manager] Global UncaughtException detectada:', error);
        });

        process.on('unhandledRejection', function rustplusUnhandled(reason: any) {
          if (reason?.message?.includes('FCM not registered')) {
            console.warn(`[RustPlus Manager] Ignorando (FCM not registered for this user).`);
            return;
          }
          console.error('[RustPlus Manager] Global UnhandledRejection:', reason);
        });
      }
    }
  }

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
      
      // Validación defensiva contra datos corruptos en DB
      if (!connection.playerId || !connection.playerToken) {
        console.error(`[RustPlus] ABORT: Invalid credentials for ${connection.ip}. PlayerID: ${connection.playerId}, Token: ${connection.playerToken}`);
        return reject(new Error("Credenciales de servidor inválidas o incompletas en la base de datos."));
      }

      const rustplus = new RustPlus(
        connection.ip,
        parseInt(connection.port), 
        String(connection.playerId), 
        parseInt(String(connection.playerToken)),
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
        this.startMonitoring(steamId, connection.ip);
        this.emit("connected", { steamId, ip: connection.ip, useProxy: !!connection.useProxy });
        resolve(rustplus);
      });

      rustplus.on("message", (message: any) => {
        if (message.broadcast?.teamMessage) {
          const teamKey = `${steamId}-${connection.ip}`;
          const chatMsg = message.broadcast.teamMessage.message;
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

    const rawCommand = cmd.trim();
    const splitCmd = rawCommand.toLowerCase().split(" ");
    const baseCommand = splitCmd[0];
    const args = rawCommand.split(" ").slice(1).join(" ");
    
    console.log(`[HK Bot] Procesando comando de equipo: "${baseCommand}" (Args: "${args}") desde ${steamId} en ${ip}`);
    
    try {
      if (baseCommand === "!time" || baseCommand === "!hora") {
        console.log(`[HK Bot] Ejecutando !time...`);
        const timeResp = await this.sendRequest(steamId, ip, { getTime: {} });
        const t = timeResp.response.time;
        
        // Formatear hora de Rust (viene en decimal 0.0 - 24.0)
        const hours = Math.floor(t.time);
        const mins = Math.floor((t.time - hours) * 60);
        const formattedTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        
        let remainingMsg = "";
        const sunrise = t.sunrise || 8.0;
        const sunset = t.sunset || 20.0;
        const dayLength = t.dayLengthMinutes || 60; // default safe fallback
        
        if (t.time >= sunrise && t.time < sunset) {
            const inGameHours = sunset - t.time;
            const realMins = Math.round(inGameHours * (dayLength / 24));
            remainingMsg = `Faltan ${realMins}m para la noche 🌙`;
        } else {
            const inGameHours = (t.time >= sunset) ? (24 - t.time) + sunrise : (sunrise - t.time);
            // La noche comúnmente va más rápido o igual, calculamos en base proporcional:
            const realMins = Math.round(inGameHours * (dayLength / 24));
            remainingMsg = `Faltan ${realMins}m para el día ☀️`;
        }
        
        rustplus.sendTeamMessage(`:exclamation: Hora: ${formattedTime} (${remainingMsg})`);
      } 
      else if (baseCommand === "!pop" || baseCommand === "!jugadores") {
        console.log(`[HK Bot] Ejecutando !pop...`);
        const infoResp = await this.sendRequest(steamId, ip, { getInfo: {} });
        const i = infoResp.response.info;
        console.log(`[HK Bot] Pop info obtenida: ${i.players}/${i.maxPlayers}. Enviando mensaje...`);
        rustplus.sendTeamMessage(`:exclamation: Población: ${i.players}/${i.maxPlayers} online (Cola: ${i.queued || 0})`);
      }
      else if (baseCommand === "!wipe") {
        const infoResp = await this.sendRequest(steamId, ip, { getInfo: {} });
        const wipeTime = infoResp.response.info.wipeTime;
        if (wipeTime) {
          const wipeDate = new Date(wipeTime * 1000).toLocaleString('es-AR');
          rustplus.sendTeamMessage(`:exclamation: Último Wipe: ${wipeDate}`);
        } else {
          rustplus.sendTeamMessage(`:exclamation: No hay datos del Wipe.`);
        }
      }
      else if (baseCommand === "!eventos" || baseCommand === "!events" || baseCommand === "!evento") {
        console.log(`[HK Bot] Ejecutando !eventos...`);
        const markersResp = await this.sendRequest(steamId, ip, { getMapMarkers: {} });
        const markers = markersResp.response.mapMarkers.markers || [];
        
        const activeEvents: string[] = [];
        
        markers.forEach((m: any) => {
          if (m.type === 5) activeEvents.push("🚢 Cargo Ship");
          else if (m.type === 8) activeEvents.push("🚁 Heli Patrulla");
          else if (m.type === 4) activeEvents.push("🚁 Chinook (CH47)");
          else if (m.type === 6) activeEvents.push("📦 Crate");
          else if (m.type === 2) activeEvents.push("💥 Explosión");
        });

        if (activeEvents.length > 0) {
          // Count occurrences to make it cleaner (e.g. "2x 💥 Explosión")
          const counts: any = {};
          activeEvents.forEach((e: string) => counts[e] = (counts[e] || 0) + 1);
          const eventList = Object.entries(counts).map(([k, v]) => v === 1 ? k : `${v}x ${k}`).join(", ");
          rustplus.sendTeamMessage(`:exclamation: Eventos Activos: ${eventList}`);
        } else {
          rustplus.sendTeamMessage(`:exclamation: No hay eventos globales activos en este momento.`);
        }
      }
      else if (baseCommand === "!team" || baseCommand === "!equipo") {
        console.log(`[HK Bot] Ejecutando !team...`);
        const teamResp = await this.sendRequest(steamId, ip, { getTeamInfo: {} });
        const members = teamResp.response.teamInfo.members || [];
        
        let online = 0;
        let dead = 0;
        members.forEach((m: any) => {
          if (m.isOnline) online++;
          if (!m.isAlive) dead++;
        });
        rustplus.sendTeamMessage(`:exclamation: Equipo: ${online}/${members.length} Online. ${dead > 0 ? ('(' + dead + ' Muertos 💀)') : '¡Todos Vivos!'}`);
      }
      else if (baseCommand === "!mapa" || baseCommand === "!seed" || baseCommand === "!map") {
        console.log(`[HK Bot] Ejecutando !mapa...`);
        const infoResp = await this.sendRequest(steamId, ip, { getInfo: {} });
        const info = infoResp.response.info;
        rustplus.sendTeamMessage(`:exclamation: Mapa: ${info.map} (Tamaño: ${info.mapSize} | Seed: ${info.seed})`);
      }
      else if (baseCommand === "!upkeep" || baseCommand === "!tc") {
        rustplus.sendTeamMessage(`:exclamation: Utiliza el Dashboard para ver el mapa y cámaras.`);
      }
      else if (baseCommand === "!lider" || baseCommand === "!leader") {
        if (!args) {
          rustplus.sendTeamMessage(`:exclamation: Uso: !lider <nombre del jugador>`);
          return;
        }
        console.log(`[HK Bot] Ejecutando !lider para ${args}...`);
        const teamResp = await this.sendRequest(steamId, ip, { getTeamInfo: {} });
        const members = teamResp.response.teamInfo.members || [];
        const target = members.find((m: any) => m.name && m.name.toLowerCase().includes(args.toLowerCase()));

        if (target) {
          await this.sendRequest(steamId, ip, { promoteToLeader: { steamId: target.steamId } });
          rustplus.sendTeamMessage(`:exclamation: 👑 ${target.name} ha sido promovido a líder del equipo.`);
        } else {
          rustplus.sendTeamMessage(`:exclamation: No se encontró a nadie llamado "${args}" en el equipo.`);
        }
      }
      else if (baseCommand === "!help" || baseCommand === "!ayuda") {
        rustplus.sendTeamMessage(`:exclamation: Comandos: !pop, !time, !wipe, !eventos, !team, !mapa, !lider, !tc`);
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

  async getMap(steamId: string, ip: string, serverId?: string | null, forceRefresh = false): Promise<any> {
    const logPrefix = `[RustPlus Manager Map]`;
    
    // 1. Intentar cargar desde cache persistente si tenemos serverId
    if (serverId && !forceRefresh) {
      const cached: any = db.getMapCache(serverId);
      if (cached) {
        console.log(`${logPrefix} Usando caché de DB para ${serverId}`);
        return {
          response: {
            map: {
              jpgImage: Buffer.from(cached.jpgImage, 'base64'),
              width: cached.width,
              height: cached.height,
              oceanMargin: cached.oceanMargin,
              monuments: cached.monuments,
              cached: true,
              updatedAt: cached.updatedAt
            }
          }
        };
      }
    }

    console.log(`${logPrefix} Solicitando MAP real para ${ip} (Timeout: 90s)...`);
    
    try {
      const response = await this.sendRequest(steamId, ip, { getMap: {} }, 90000);
      
      // Validador de respuesta de mapa
      if (!response?.response?.map) {
        console.warn(`${logPrefix} Respuesta vacía para ${ip}`);
        throw new Error("El servidor devolvió una respuesta de mapa vacía. Posible error de .proto");
      }

      // 2. Guardar en caché si tenemos éxito y serverId
      if (serverId && response.response.map.jpgImage) {
        try {
          const map = response.response.map;
          const base64 = Buffer.from(map.jpgImage).toString('base64');
          db.saveMapCache(serverId, {
            jpgImage: base64,
            width: map.width,
            height: map.height,
            oceanMargin: map.oceanMargin,
            monuments: map.monuments
          });
          console.log(`${logPrefix} Mapa guardado en caché para ${serverId}`);
        } catch (cacheErr) {
          console.error(`${logPrefix} Error guardando caché:`, cacheErr);
        }
      }

      return response;
    } catch (error: any) {
      console.error(`${logPrefix} Error en ${ip}:`, error.message || error);

      // Si es un timeout, advertir sobre la posibilidad de usar Proxy o Fallback.
      if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        console.warn(`${logPrefix} Timeout detectado para ${ip}.`);
        
        const connection = Array.from(this.connections.values()).find(c => (c as any).server === ip);
        if (connection && !(connection as any).useFacepunchProxy) {
          throw new Error("Timeout prolongado en mapa. Intenta activar 'Usar Proxy' en la configuración del servidor.");
        }
      }
      throw error;
    }
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

  async setEntityValue(steamId: string, ip: string, entityId: string, value: boolean) {
    return this.sendRequest(steamId, ip, {
      setEntityValue: { entityId, value }
    });
  }

  async getCameraFrame(steamId: string, ip: string, identifier: string, frameIndex: number = 0) {
    return this.sendRequest(steamId, ip, {
      getCameraFrame: { identifier, frameIndex }
    }, 20000); // 20s timeout for camera frames
  }

  async sendEntityInput(steamId: string, ip: string, entityId: string, input: any) {
    // Para controlar drones/turretas (botones de movimiento)
    // En versiones actuales de rustplus.js, esto suele ser un request custom
    return this.sendRequest(steamId, ip, {
      setEntityValue: { entityId, value: true }
    });
  }

  async toggleGroup(steamId: string, ip: string, entityIds: string[], value: boolean) {
    return Promise.all(entityIds.map(id => this.setEntityValue(steamId, ip, id, value)));
  }

  // =====================================================================
  // INTEL FEED LOGGING
  // =====================================================================
  private addIntel(steamId: string, ip: string, type: 'DEATH' | 'EVENT' | 'RAID' | 'SYS', message: string, data?: any) {
    const key = `${steamId}-${ip}`;
    if (!this.intelLogs.has(key)) {
      this.intelLogs.set(key, []);
    }
    const log = this.intelLogs.get(key)!;
    
    log.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      data,
      timestamp: Date.now()
    });

    if (log.length > 50) log.shift(); // Keep last 50
    this.intelLogs.set(key, log);
    
    // Emitir para posibles integraciones en tiempo real (WebSockets futuros)
    this.emit("intel", { steamId, ip, type, message, data });
  }

  getIntelLog(steamId: string, ip: string) {
    return this.intelLogs.get(`${steamId}-${ip}`) || [];
  }

  // =====================================================================
  // SERVICIO DE MONITOREO Y ALERTAS AUTOMÁTICAS
  // =====================================================================
  private async startMonitoring(steamId: string, ip: string) {
    const key = `${steamId}-${ip}`;
    if (this.monitorIntervals.has(key)) return;

    console.log(`[Monitor] Iniciando vigilancia activa para ${ip}...`);

    const interval = setInterval(async () => {
      if (!this.ready.get(key)) return;

      try {
        const [teamResp, markersResp, infoResp] = await Promise.all([
          this.getTeamInfo(steamId, ip).catch(() => null),
          this.getMapMarkers(steamId, ip).catch(() => null),
          this.sendRequest(steamId, ip, { getInfo: {} }).catch(() => null)
        ]);

        if (teamResp) this.processTeamMonitor(steamId, ip, teamResp.response.teamInfo, infoResp?.response?.info);
        if (markersResp) this.processMarkersMonitor(steamId, ip, markersResp.response.mapMarkers.markers, infoResp?.response?.info);

      } catch (err) {
        // Silencioso para no ensuciar logs de monitoreo cada 15s
      }
    }, 15000); // Revisar cada 15 seg

    this.monitorIntervals.set(key, interval);
  }

  private processTeamMonitor(steamId: string, ip: string, teamInfo: any, serverInfo: any) {
    const key = `${steamId}-${ip}`;
    const members = teamInfo.members || [];
    const mapSize = serverInfo?.mapSize || 4000;
    const rustplus = this.connections.get(key);
    
    if (!this.lastMemberStates.has(key)) {
      this.lastMemberStates.set(key, new Map());
    }
    const states = this.lastMemberStates.get(key)!;

    members.forEach((m: any) => {
      const last = states.get(m.steamId);
      const grid = worldToGrid(m.x, m.y, mapSize);

      if (last) {
        // 1. Detección de Desconexión
        if (last.isOnline && !m.isOnline) {
          rustplus.sendTeamMessage(`:exclamation: ${m.name} se ha desconectado.`);
          this.addIntel(steamId, ip, 'SYS', `${m.name} se ha desconectado.`);
        }
        // 2. Detección de Re-conexión
        else if (!last.isOnline && m.isOnline) {
          rustplus.sendTeamMessage(`:exclamation: ${m.name} ha vuelto.`);
          this.addIntel(steamId, ip, 'SYS', `${m.name} ha vuelto.`);
        }

        // 3. Detección de Muerte (Solo si estaba vivo)
        if (last.isAlive && !m.isAlive) {
          const deathMsg = `¡${m.name} ha muerto en ${grid}!`;
          console.log(`[Monitor] Muerte detectada para miembro del equipo: ${m.name} en ${grid} (${Math.round(m.x)}, ${Math.round(m.y)})`);
          this.addIntel(steamId, ip, 'DEATH', deathMsg, { name: m.name, grid, x: m.x, y: m.y });
          
          this.sendTeamMessage(steamId, ip, `:exclamation: ${deathMsg} (Coord: ${Math.round(m.x)}, ${Math.round(m.y)})`)
            .catch(e => console.warn(`[Monitor] Error enviando mensaje de muerte para ${m.name}:`, e.message));

          // Alerta en Discord
          const server = db.getServers(steamId).find((s: any) => s.ip === ip);
          if (server && (server.discordWebhook || server.discordChannelId)) {
            const { DiscordManager } = require('@/lib/discord/DiscordManager');
            DiscordManager.sendDeath({
              webhookUrl: server.discordWebhook,
              channelId: server.discordChannelId
            }, m.name || "Miembro del equipo", m.x, m.y, server.name);
          }
        }

        // 4. Lógica de AFK simplificada (No se movió en 15s, guardamos timestamp)
        const hasMoved = Math.abs(last.x - m.x) > 1 || Math.abs(last.y - m.y) > 1;
        if (m.isOnline && !hasMoved) {
          if (!last.afkSince) m.afkSince = Date.now();
          else m.afkSince = last.afkSince;
        } else if (m.isOnline && hasMoved && last.afkSince) {
          const afkDuration = Math.round((Date.now() - last.afkSince) / 60000);
          if (afkDuration >= 5) { // Solo avisar si estuvo > 5 min quieto
            rustplus.sendTeamMessage(`:exclamation: ${m.name} ha dejado de estar AFK (estuvo quieto ${afkDuration}m).`);
          }
          m.afkSince = null;
        }
      }

      states.set(m.steamId, { ...m, grid });
    });
  }

  private processMarkersMonitor(steamId: string, ip: string, markers: any[], serverInfo: any) {
    const key = `${steamId}-${ip}`;
    const rustplus = this.connections.get(key);
    const lastMarkers = this.lastMarkerStates.get(key) || [];
    const mapSize = serverInfo?.mapSize || 4000;
    
    // Solo nos interesan eventos globales
    const currentEventIds = markers
      .filter(m => [4, 5, 6, 8].includes(m.type)) // Chinook, Cargo, Crate, Heli
      .map(m => m.id);

    const lastEventIds = lastMarkers.map(m => m.id);

    // Detectar Deepsea Event (Casino Bar Shopkeeper en tiendas)
    const deepSeaVendor = markers.find(m => 
        m.type === 3 && m.name && m.name.includes("Casino Bar Shopkeeper")
    );
    const prevDeepSeaVendor = lastMarkers.find(m => 
        m.type === 3 && m.name && m.name.includes("Casino Bar Shopkeeper")
    );

    if (deepSeaVendor && !prevDeepSeaVendor) {
      const grid = worldToGrid(deepSeaVendor.x, deepSeaVendor.y, mapSize);
      const msg = `¡Deepsea Event iniciado en ${grid}! Vendedor detectado.`;
      rustplus.sendTeamMessage(`:exclamation: ${msg}`);
      this.addIntel(steamId, ip, 'EVENT', msg, { grid });
    }

    // Detectar nuevos eventos
    markers.forEach(m => {
      if ([4, 5, 6, 8].includes(m.type) && !lastEventIds.includes(m.id)) {
        const grid = worldToGrid(m.x, m.y, mapSize);
        let msg = "";
        let eventName = "";
        
        if (m.type === 5) {
          msg = `:exclamation: ¡Cargo Ship detectado en ${grid}!`;
          eventName = "🚢 Barco (Cargo Ship)";
        } else if (m.type === 4) {
          msg = `:exclamation: ¡Chinook (CH47) en curso hacia ${grid}!`;
          eventName = "🚁 Chinook (CH47)";
        } else if (m.type === 8) {
          msg = `:exclamation: ¡Helicóptero de Patrulla activo en ${grid}!`;
          eventName = "🚁 Heli Patrulla";
        } else if (m.type === 6) {
           const isFar = Math.abs(m.x - mapSize/2) > mapSize/3 || Math.abs(m.y - mapSize/2) > mapSize/3;
           if (isFar) {
              msg = `:exclamation: ¡Oil Rig (Petro) activo en ${grid}! Caja fuerte detectada.`;
              eventName = "📦 Oil Rig (Petro)";
           } else {
              msg = `:exclamation: ¡Caja Fuerte (Locked Crate) detectada en ${grid}!`;
              eventName = "📦 Caja Fuerte (Locked Crate)";
           }
        }
        
        if (msg) {
          rustplus.sendTeamMessage(msg);
          this.addIntel(steamId, ip, 'EVENT', msg.replace(':exclamation: ', ''), { eventName, grid });
          
          // Alerta en Discord
          const server = db.getServers(steamId).find((s: any) => s.ip === ip);
          if (server && (server.discordWebhook || server.discordChannelId)) {
            const { DiscordManager } = require('@/lib/discord/DiscordManager');
            DiscordManager.sendEvent({
              webhookUrl: server.discordWebhook,
              channelId: server.discordChannelId
            }, eventName, grid, server.name);
          }
        }
      }
    });

    this.lastMarkerStates.set(key, markers);
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

  // Diagnostic & Auto-Patch helper
  public async checkProtos(): Promise<any> {
    const fs = require('fs');
    const path = require('path');
    
    console.log("[RustPlus] Starting Self-Patching Protocol Check...");
    
    const results: any = {
      cwd: process.cwd(),
      dirname: __dirname,
      files: {}
    };

    // 1. Find where the library is actually running from
    let libPath = '';
    try {
      libPath = path.dirname(require.resolve('@liamcottle/rustplus.js'));
      console.log(`[RustPlus] Library detected at: ${libPath}`);
    } catch (e) {
      console.error("[RustPlus] Could not resolve library path!");
    }

    // 2. Definir donde DEBERÍAN estar los protos (en el root o en data)
    const sourceProtos = [
      path.join(process.cwd(), 'node_modules/@liamcottle/rustplus.js/rustplus.proto'),
      path.join(process.cwd(), 'rustplus.proto'),
      path.join(process.cwd(), 'resources/rustplus.proto'),
      '/ROOT/node_modules/@liamcottle/rustplus.js/rustplus.proto',
      '/app/node_modules/@liamcottle/rustplus.js/rustplus.proto'
    ];

    // 3. Intentar parchear la librería COPIANDO el archivo a su lado
    if (libPath) {
      const targetProto = path.join(libPath, 'rustplus.proto');
      if (!fs.existsSync(targetProto) || fs.statSync(targetProto).size < 100) {
        console.log(`[RustPlus] Target proto MISSING or INVALID at ${targetProto}. Searching...`);
        for (const src of sourceProtos) {
          if (fs.existsSync(src)) {
            console.log(`[RustPlus] FOUND source proto at ${src}. Patching library...`);
            try {
              fs.copyFileSync(src, targetProto);
              console.log("[RustPlus] SUCCESS: Library patched with rustplus.proto.");
              break;
            } catch (copyErr) {
              console.error(`[RustPlus] Failed to copy proto: ${copyErr}`);
            }
          }
        }
      } else {
        console.log(`[RustPlus] Proto present in library folder (${fs.statSync(targetProto).size} bytes).`);
      }
    }

    // Diagnostic logging of all potential locations
    const routes = [
      path.resolve(__dirname, '../../node_modules/@liamcottle/rustplus.js/rustplus.proto'),
      path.resolve(process.cwd(), 'node_modules/@liamcottle/rustplus.js/rustplus.proto'),
      '/ROOT/node_modules/@liamcottle/rustplus.js/rustplus.proto',
      '/ROOT/.next/standalone/node_modules/@liamcottle/rustplus.js/rustplus.proto',
      path.join(libPath || '', 'rustplus.proto')
    ];

    routes.forEach(r => {
      if (r) results.files[r] = fs.existsSync(r);
    });

    console.log("[RustPlus Diagnostic Final]:", JSON.stringify(results, null, 2));
    return results;
  }
}

// Singleton for the whole app (persists across requests in Next.js)
const globalStore = global as any;

export const rustPlusManager: RustPlusManager = globalStore._rustPlusManager || (globalStore._rustPlusManager = new RustPlusManager());

if (typeof window === 'undefined') {
  rustPlusManager.checkProtos().catch(err => console.error("[RustPlus Startup Error]:", err));
}
