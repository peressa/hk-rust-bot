import db, { saveTeamMessage, getMapCache, saveMapCache, getServers, getEntities, saveVending } from "../db";
import RustPlus from "@liamcottle/rustplus.js";

import { worldToGrid, worldToLeaflet, getRegionName } from "./coordUtils";
import { FcmManager } from "../fcm/FcmManager";
import protobuf from "protobufjs";
import { EventEmitter } from "events";
import fs from 'fs';
import path from 'path';
import { 
  RustPlusMember, 
  RustPlusMarker, 
  RustPlusInfo, 
  RustPlusTeamInfo, 
  RustPlusResponse, 
  RustPlusMessage,
  RustPlusMap
} from "../../types/rustplus";
import { DbServer, DbEntity } from "../../types/db";
import { DiscordManager } from "../discord/DiscordManager";
import { CommandRouter } from './CommandRouter';

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

function getJpgSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return null;
  let offset = 2;
  while (offset < buffer.length) {
    const marker = buffer.readUInt16BE(offset);
    const length = buffer.readUInt16BE(offset + 2);
    if (marker === 0xFFC0 || marker === 0xFFC2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }
    offset += 2 + length;
  }
  return null;
}

export interface ServerConnection {
  ip: string;
  port: string;
  playerId: string;
  playerToken: string;
  useProxy?: boolean;
}

class RustPlusManager extends EventEmitter {
  private connections: Map<string, any> = new Map();
  private connecting: Map<string, Promise<any>> = new Map(); 
  private chatHistory: Map<string, any[]> = new Map(); 
  private ready: Map<string, boolean> = new Map(); 
  private monitorIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastMemberStates: Map<string, Map<string, RustPlusMember>> = new Map(); 
  private lastMarkerStates: Map<string, RustPlusMarker[]> = new Map(); 
  private intelLogs: Map<string, any[]> = new Map(); 
  private lastDockedStates: Map<string, Set<number>> = new Map(); 
  private botSettings: Map<string, { prefix: string, templates: any }> = new Map(); 
  private lastActivity: Map<string, number> = new Map(); 
  private reconnectAttempts: Map<string, number> = new Map(); 
  private reconnectTimer: Map<string, NodeJS.Timeout> = new Map(); 
  private lastExplosions: Map<string, { grid: string, timestamp: number }[]> = new Map(); 
  private lastBaseAlerts: Map<string, number> = new Map(); 
  private lastEntityStates: Map<string, Map<string, boolean>> = new Map(); 
  private playerHistory: Map<string, Map<string, { x: number, y: number, time: number }[]>> = new Map(); 
  private pendingVendingAlerts: Map<string, any[]> = new Map(); 

  constructor() {
    super();

    // 1. Evitar que this.emit("error") explote si nadie está escuchando (ERR_UNHANDLED_ERROR)
    this.on('error', (err) => {
      console.error(`[RustPlus Manager] Error emitido (no capturado):`, err.message || err);
    });

    // 2. Prevenir que errores asíncronos de sockets o protobufs maten el proceso Next.js
    if (typeof process !== 'undefined') {
      const isRegistered = process.listeners('uncaughtException').some(l => l.name === 'rustplusUncaught');
      if (!isRegistered) {
        process.on('uncaughtException', function rustplusUncaught(error: any) {
          if (error.message?.includes('ProtocolError') || error.message?.includes('required')) {
            console.warn(`[RustPlus Manager] Ignorando Uncaught ProtocolError: ${error.message}`);
            return;
          }
          // Ignorar el error de evento no manejado que nosotros mismos disparamos arriba
          if (error.code === 'ERR_UNHANDLED_ERROR') {
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
        this.reconnectAttempts.set(key, 0); // Reset backoff al éxito
        this.lastActivity.set(key, Date.now());
        this.startMonitoring(steamId, connection.ip);
        this.emit("connected", { steamId, ip: connection.ip, useProxy: !!connection.useProxy });
        resolve(rustplus);
      });

      rustplus.on("message", (message: any) => {
        this.lastActivity.set(key, Date.now());
        // Despachador asíncrono no bloqueante (Fase 1.3)
        setImmediate(() => this.processMessage(steamId, connection, message));
      });

      rustplus.on("disconnected", () => {
        console.log(`[RustPlus] Disconnected from ${connection.ip}`);
        const wasReady = this.ready.get(key);
        this.ready.set(key, false);
        this.connections.delete(key);
        this.connecting.delete(key);
        this.emit("disconnected", { steamId, ip: connection.ip });

        // Auto-Reconexión Inteligente (Fase 1.4)
        this.handleReconnect(steamId, connection);
      });

      rustplus.on("error", (error: any) => {
        clearTimeout(timeout);
        const errMsg = error?.message || String(error);
        console.error(`[RustPlus] Error on ${connection.ip}:`, errMsg);
        
        this.ready.set(key, false);
        this.connections.delete(key);
        this.connecting.delete(key);
        this.emit("error", { steamId, ip: connection.ip, error });

        if (!connection.useProxy && (
          errMsg.includes('socket') || 
          errMsg.includes('ECONNREFUSED') || 
          errMsg.includes('hang up') || 
          errMsg.includes('418')
        )) {
          console.log(`[RustPlus] Error en conexión (${errMsg}). Reintentando vía Proxy...`);
          this.internalConnect(steamId, { ...connection, useProxy: true }, true).then(resolve).catch(reject);
        } else {
          this.handleReconnect(steamId, connection);
          reject(error);
        }
      });

      rustplus.connect();
    });
  }

  private getBotSettings(steamId: string, ip: string) {
    const key = `${steamId}-${ip}`;
    if (this.botSettings.has(key)) return this.botSettings.get(key)!;

    try {
      const server = db.prepare("SELECT botPrefix, botTemplates FROM servers WHERE steamId = ? AND ip = ?").get(steamId, ip) as any;
      const settings = {
        prefix: server?.botPrefix || ':exclamation:',
        templates: server?.botTemplates ? JSON.parse(server.botTemplates) : {}
      };
      this.botSettings.set(key, settings);
      return settings;
    } catch (e) {
      return { prefix: ':exclamation:', templates: {} };
    }
  }

  public clearSettingsCache(steamId: string, ip: string) {
    this.botSettings.delete(`${steamId}-${ip}`);
    console.log(`[RustPlus Manager] Cache de configuración limpiada para ${ip}`);
  }

  public formatMsg(steamId: string, ip: string, templateKey: string, defaultText: string, vars: Record<string, any> = {}) {
    const settings = this.getBotSettings(steamId, ip);
    let msg = settings.templates[templateKey] || defaultText;
    
    Object.entries(vars).forEach(([k, v]) => {
      msg = msg.replace(new RegExp(`{${k}}`, 'g'), String(v));
    });

    // Asegurarse de que el prefijo sea dinámico y no haya emojis
    const prefix = settings.prefix || ':exclamation:';
    return `${prefix} ${msg}`.trim();
  }

  private async handleTeamCommand(steamId: string, ip: string, messageContent: string) {
    await CommandRouter.handle(steamId, ip, messageContent);
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
        client.sendRequest(request, (response: RustPlusResponse) => {
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
      const cached: any = getMapCache(serverId);
      // Aceptar caché válida (oceanMargin >= 0 es válido, 0 = sin margen de océano)
      if (cached && cached.mapSize &&
          cached.oceanMargin !== undefined &&
          cached.oceanMargin !== null &&
          cached.oceanMargin !== Math.floor(cached.mapSize / 2)) {
        console.log(`${logPrefix} Usando caché de DB para ${serverId} (Size: ${cached.mapSize}, Ocean: ${cached.oceanMargin})`);
        return {
          response: {
            map: {
              jpgImage: Buffer.from(cached.jpgImage, 'base64'),
              width: cached.width,
              height: cached.height,
              mapSize: cached.mapSize,
              oceanMargin: cached.oceanMargin,
              monuments: cached.monuments,
              cached: true,
              updatedAt: cached.updatedAt
            }
          }
        };
      }
    }

    console.log(`${logPrefix} Solicitando MAP e INFO real para ${ip} (Timeout: 90s)...`);
    
    try {
      // Necesitamos tanto el mapa como el info para tener el mapSize real (unidades Unity)
      const [mapResp, infoResp] = await Promise.all([
        this.sendRequest(steamId, ip, { getMap: {} }, 90000) as Promise<RustPlusResponse>,
        this.sendRequest(steamId, ip, { getInfo: {} }).catch(() => null) as Promise<RustPlusResponse | null>
      ]);

      const map = mapResp?.response?.map;
      const info = infoResp?.response?.info;

      if (!map) {
        throw new Error("El servidor devolvió una respuesta de mapa vacía.");
      }

      if (map.jpgImage) {
          const imageBuffer = Buffer.isBuffer(map.jpgImage) ? map.jpgImage : Buffer.from(map.jpgImage);
          const base64 = imageBuffer.toString('base64');

          // METADATOS DEL PROTO (En Píxeles)
          // map.width/height: Píxeles totales de la imagen.
          // map.oceanMargin: Píxeles de océano alrededor de la tierra.
          const realSize = getJpgSize(imageBuffer);
          const pixelWidth = map.width || realSize?.width || 1000;
          const pixelHeight = map.height || realSize?.height || pixelWidth;
          const oceanMarginPx = map.oceanMargin || 0;

          // METADATOS DEL MUNDO (En Metros/Unity)
          const mapSize = info?.mapSize || 4000;

          console.log(`${logPrefix} [MAP PROTO] Pixels=${pixelWidth}x${pixelHeight}, MarginPx=${oceanMarginPx}, WorldUnits=${mapSize}`);

          if (serverId) {
              saveMapCache(serverId, {
                jpgImage: base64,
                width: pixelWidth,
                height: pixelHeight,
                monuments: map.monuments || [],
                mapSize: mapSize,
                oceanMargin: oceanMarginPx
              });
          }

          // Inyectamos metadatos originales en la respuesta
          map.jpgImage = base64;
          map.width = pixelWidth;
          map.height = pixelHeight;
          map.mapSize = mapSize;
          map.oceanMargin = oceanMarginPx;
      }

      return mapResp;
    } catch (error: any) {
      console.error(`${logPrefix} Error al obtener mapa para ${ip}:`, error.message || error);

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

      const last = this.lastActivity.get(key) || 0;
      const inactiveTime = Date.now() - last;

      try {
        const promises: Promise<any>[] = [
          this.getTeamInfo(steamId, ip).catch(() => null),
          this.getMapMarkers(steamId, ip).catch(() => null)
        ];

        // Fase 1.1: Heartbeat Pasivo (Solo ping si no hay eventos por 5 min)
        if (inactiveTime > 300000) {
           console.log(`[Heartbeat] Silencio en ${ip}. Verificando conexión...`);
           promises.push(this.sendRequest(steamId, ip, { getInfo: {} }).catch(() => null));
           this.lastActivity.set(key, Date.now());
        }

        const [teamResp, markersResp, infoResp] = await Promise.all(promises) as [RustPlusResponse | null, RustPlusResponse | null, RustPlusResponse | null];

        if (teamResp?.response?.teamInfo) this.processTeamMonitor(steamId, ip, teamResp.response.teamInfo, infoResp?.response?.info);
        if (markersResp?.response?.mapMarkers) this.processMarkersMonitor(steamId, ip, markersResp.response.mapMarkers.markers, infoResp?.response?.info);
        
        // Fase 2.3: Monitoreo de Entidades Inteligentes (Smart Alarms / Switches)
        this.monitorEntities(steamId, ip).catch(() => {});

        // Fase 2.2: Monitoreo de Vida de Base (Decay)
        if (infoResp?.response?.info) {
          const info = infoResp.response.info;
          const expiry = info.protectionExpiry || 0;
          if (expiry > 0) {
            const nowSeconds = Date.now() / 1000;
            const remainingHours = (expiry - nowSeconds) / 3600;
            if (remainingHours < 12) {
              const decayKey = `${key}-decay`;
              const lastDecayAlert = this.lastBaseAlerts.get(decayKey) || 0;
              if (Date.now() - lastDecayAlert > 14400000) { // Cada 4 horas
                const msg = this.formatMsg(steamId, ip, 'decay_alert', `¡ALERTA DE MANTENIMIENTO! Quedan menos de {hours} horas de protección en el armario (TC).`, { hours: Math.round(remainingHours) });
                this.botSendTeamMessage(steamId, ip, msg);
                this.addIntel(steamId, ip, 'SYS', msg, { hours: Math.round(remainingHours) });
                this.lastBaseAlerts.set(decayKey, Date.now());
              }
            }
          }
        }

      } catch (err) {
        // Silencioso
      }
    }, 15000); // Revisar cada 15 seg para inteligencia táctica

    this.monitorIntervals.set(key, interval);
  }

  /**
   * Fase 2.3: Monitorea el estado de interruptores y alarmas inteligentes.
   */
  private async monitorEntities(steamId: string, ip: string) {
    const key = `${steamId}-${ip}`;
    // Buscamos el servidor en la DB para obtener su ID y webhook
    const servers = getServers(steamId);
    const serverObj = servers.find((s: any) => s.ip === ip) as any;
    if (!serverObj) return;

    const entities = getEntities(steamId, serverObj.id);
    if (!entities || entities.length === 0) return;

    if (!this.lastEntityStates.has(key)) this.lastEntityStates.set(key, new Map());
    const states = this.lastEntityStates.get(key)!;

    for (const ent of entities) {
      try {
        const resp = await this.sendRequest(steamId, ip, {
          entityId: parseInt(ent.entityId),
          getEntityInfo: {}
        }) as RustPlusResponse;
        
        if (resp?.response?.entityInfo) {
          const isActive = resp.response.entityInfo.payload.value === true;
          const prevStatus = states.get(ent.entityId);
          
          if (prevStatus !== undefined && prevStatus !== isActive) {
            let msg = "";
            if (ent.entityType === 1) { // Interruptor
               msg = this.formatMsg(steamId, ip, 'sys_switch_change', `Interruptor '{name}' cambiado a {status}`, { name: ent.name, status: isActive ? 'ENCENDIDO' : 'APAGADO' });
            } else if (ent.entityType === 3) { // Alarma
               if (isActive) {
                 msg = this.formatMsg(steamId, ip, 'sys_alarm_active', `¡ALERTA! La Alarma Inteligente '{name}' se ha ACTIVADO.`, { name: ent.name });
               }
            }

            if (msg) {
              this.botSendTeamMessage(steamId, ip, msg);
              this.addIntel(steamId, ip, 'SYS', msg, { entityId: ent.entityId, name: ent.name, status: isActive });
              
              if (serverObj.discordWebhook || serverObj.discordChannelId) {
                try {
                  DiscordManager.sendGenericAlert(serverObj, "Alerta de Dispositivo", msg);
                } catch (e) {}
              }
            }
          }
          states.set(ent.entityId, isActive);
        }
      } catch (e) {
        // Error consultando entidad (posiblemente fuera de rango o destruida)
      }
    }
  }

  private processTeamMonitor(steamId: string, ip: string, teamInfo: RustPlusTeamInfo, serverInfo?: RustPlusInfo) {
    const key = `${steamId}-${ip}`;
    const members = teamInfo.members || [];
    const mapSize = serverInfo?.mapSize || 4000;
    const oceanMargin = (serverInfo?.oceanMargin !== undefined && serverInfo?.oceanMargin !== null && serverInfo?.oceanMargin > 0)
      ? serverInfo.oceanMargin
      : 0;
    if (!this.lastMemberStates.has(key)) {
      this.lastMemberStates.set(key, new Map());
    }
    const states = this.lastMemberStates.get(key)!;

    members.forEach((m: any) => {
      const last = states.get(m.steamId);
      const grid = worldToGrid(m.x, m.y, mapSize);

      // Fase 3.1: Registro de Rutas de Movimiento
      if (m.isAlive && m.isOnline) {
        if (!this.playerHistory.has(key)) this.playerHistory.set(key, new Map());
        const historyMap = this.playerHistory.get(key)!;
        if (!historyMap.has(m.steamId)) historyMap.set(m.steamId, []);
        const path = historyMap.get(m.steamId)!;
        const lastPos = path[path.length - 1];
        const dist = lastPos ? Math.sqrt(Math.pow(m.x - lastPos.x, 2) + Math.pow(m.y - lastPos.y, 2)) : 100;
        if (dist > 10) { // Registrar cada 10 metros para una ruta suave
          path.push({ x: m.x, y: m.y, time: Date.now() });
          if (path.length > 20) path.shift();
        }
      }

      if (last) {
        // 1. Detección de Desconexión (Evitar spam por micro-cortes)
        if (last.isOnline && !m.isOnline) {
          const now = Date.now();
          if (!last.lastOfflineTime || (now - last.lastOfflineTime > 30000)) { // Solo si pasaron 30s del último aviso
            const msg = this.formatMsg(steamId, ip, 'alert_disconnect', `{name} se ha desconectado.`, { name: m.name });
            this.botSendTeamMessage(steamId, ip, msg);
            this.addIntel(steamId, ip, 'SYS', `${m.name} se ha desconectado.`);
            m.lastOfflineTime = now;
          }
        }
        // 2. Detección de Re-conexión
        else if (!last.isOnline && m.isOnline) {
          const now = Date.now();
          if (!last.lastOnlineTime || (now - last.lastOnlineTime > 30000)) {
            const msg = this.formatMsg(steamId, ip, 'alert_reconnect', `{name} ha vuelto.`, { name: m.name });
            this.botSendTeamMessage(steamId, ip, msg);
            this.addIntel(steamId, ip, 'SYS', `${m.name} ha vuelto.`);
            m.lastOnlineTime = now;
          }
        }

        // 3. Detección de Muerte (Solo si estaba vivo)
        if (last.isAlive && !m.isAlive) {
          const status = m.isOnline ? "online" : "offline";
          const timeLived = m.spawnTime ? Math.round((Date.now() / 1000) - m.spawnTime) : null;
          const timeStr = timeLived ? ` (Vida: ${Math.floor(timeLived / 60)}m)` : "";

          // Formato solicitado: Mensaje de muerte con persona y cuadrante claro
          const deathMsg = this.formatMsg(steamId, ip, 'alert_death', `MUERTE: {name} ha muerto en {grid}{timeStr}`, {
            name: m.name,
            status,
            grid,
            x: Math.round(m.x),
            y: Math.round(m.y),
            timeStr
          });
          
          console.log(`[Monitor] Muerte detectada: ${m.name} en ${grid}`);
          this.addIntel(steamId, ip, 'DEATH', deathMsg, { name: m.name, grid, x: m.x, y: m.y, status, timeLived });
          
          this.botSendTeamMessage(steamId, ip, deathMsg)
            .catch(e => console.warn(`[Monitor] Error enviando mensaje de muerte para ${m.name}:`, e.message));

          // Alerta en Discord
          const server = getServers(steamId).find((s: any) => s.ip === ip) as any;
          if (server && (server.discordWebhook || server.discordChannelId)) {
            DiscordManager.sendDeath({
              webhookUrl: server.discordWebhook,
              channelId: server.discordChannelId
            }, m.name || "Miembro del equipo", m.x, m.y, server.name, undefined);
          }
        }

        // 4. Lógica de AFK (Notificar cada minuto a partir de los 5 min)
        const hasMoved = Math.abs(last.x - m.x) > 0.5 || Math.abs(last.y - m.y) > 0.5; // Umbral un poco más alto
        if (m.isOnline && !hasMoved) {
          if (!last.afkSince) m.afkSince = Date.now();
          else {
            m.afkSince = last.afkSince;
            m.lastAfkAlertMin = last.lastAfkAlertMin || 0;
            const afkMins = Math.floor((Date.now() - m.afkSince) / 60000);
            
            // Solo alertar si han pasado al menos 5 min y no hemos alertado este minuto
            if (afkMins >= 5 && afkMins > m.lastAfkAlertMin) {
              const msg = this.formatMsg(steamId, ip, 'alert_afk_start', `El miembro del equipo '{name}' lleva AFK {mins} minutos en {grid}`, { name: m.name, mins: afkMins, grid });
              this.botSendTeamMessage(steamId, ip, msg);
              m.lastAfkAlertMin = afkMins;
            }
          }
        } else if (m.isOnline && hasMoved && last.afkSince) {
          const afkDuration = Math.round((Date.now() - last.afkSince) / 60000);
          if (afkDuration >= 5) {
            const msg = this.formatMsg(steamId, ip, 'alert_afk_end', `El miembro del equipo '{name}' ya no está AFK después de {mins} minutos en {grid}`, { name: m.name, mins: afkDuration, grid });
            this.botSendTeamMessage(steamId, ip, msg);
          }
          m.afkSince = null;
          m.lastAfkAlertMin = 0;
        }
      }

      states.set(m.steamId, { ...m, grid });
    });
  }

  // Wrapper para enviar mensajes y persistirlos automáticamente en el historial
  public async botSendTeamMessage(steamId: string, ip: string, message: string) {
    try {
      if (!this.isConnected(steamId, ip)) return;
      const rustplus = this.connections.get(`${steamId}-${ip}`);
      if (rustplus) {
        await rustplus.sendTeamMessage(message);
        const server = db.prepare("SELECT id FROM servers WHERE steamId = ? AND ip = ?").get(steamId, ip) as any;
        if (server) {
          saveTeamMessage(server.id, {
            steamId: "BOT",
            name: "Rust Ops",
            message: message,
            time: Date.now()
          });
        }
      }
    } catch (e) {
       console.error("[BotMessage] Error:", e);
    }
  }

  private processMarkersMonitor(steamId: string, ip: string, markers: RustPlusMarker[], serverInfo?: RustPlusInfo) {
    const key = `${steamId}-${ip}`;
    const rustplus = this.connections.get(key);
    const hasPreviousState = this.lastMarkerStates.has(key);
    const lastMarkers = this.lastMarkerStates.get(key) || [];
    const mapSize = serverInfo?.mapSize || 4000;
    // oceanMargin: igual que en processTeamMonitor, derivado de serverInfo si está disponible
    const oceanMargin = (serverInfo?.oceanMargin !== undefined && serverInfo?.oceanMargin !== null && serverInfo?.oceanMargin > 0)
      ? serverInfo.oceanMargin
      : 0;
    
    const lastEventIds = lastMarkers.map(m => m.id);
    const currentEventIds = markers.map(m => m.id);

    // 1. Detectar Cargo Ship que sale del mapa
    const lastCargoMarkers = lastMarkers.filter(m => m.type === 5);
    const currentCargoMarkers = markers.filter(m => m.type === 5);
    const currentCargoIds = currentCargoMarkers.map(m => m.id);

    lastCargoMarkers.forEach(oldM => {
      if (!currentCargoIds.includes(oldM.id)) {
        const msg = this.formatMsg(steamId, ip, 'event_cargo_exit', `El Barco de Carga (Cargo Ship) ha salido del mapa.`);
        this.botSendTeamMessage(steamId, ip, msg);
        this.addIntel(steamId, ip, 'EVENT', msg);
      }
    });

    // 2. Preparar detección de Atraque (Harbors)
    const harbors: any[] = [];
    const server = getServers(steamId).find((s: any) => s.ip === ip) as any;
    if (server) {
      const cache = getMapCache(server.id || `${steamId}-${ip}`);
      if (cache?.monuments) {
        harbors.push(...cache.monuments.filter((mon: any) => 
          mon.token.toLowerCase().includes("harbor") || mon.token.toLowerCase().includes("puerto")
        ));
      }
    }
    if (!this.lastDockedStates.has(key)) this.lastDockedStates.set(key, new Set());
    const dockedSet = this.lastDockedStates.get(key)!;

    // 3. Detectar Deepsea Event
    const deepSeaVendor = markers.find(m => 
        m.type === 3 && m.name && m.name.includes("Casino Bar Shopkeeper")
    );
    const prevDeepSeaVendor = lastMarkers.find(m => 
        m.type === 3 && m.name && m.name.includes("Casino Bar Shopkeeper")
    );
    if (deepSeaVendor && !prevDeepSeaVendor) {
      const grid = worldToGrid(deepSeaVendor.x, deepSeaVendor.y, mapSize);
      const region = getRegionName(deepSeaVendor.x, deepSeaVendor.y, mapSize);
      const msg = this.formatMsg(steamId, ip, 'event_deepsea', `¡Deepsea Event iniciado en el {region} ({grid})! Vendedor de Casino detectado.`, { region, grid });
      this.sendTeamMessage(steamId, ip, msg);
      this.addIntel(steamId, ip, 'EVENT', msg, { grid, region });
    }

    // 4. Detectar nuevos eventos y atraques
    markers.forEach(m => {
      // Eventos Globales (No Vending)
      if ([4, 5, 6, 8].includes(m.type) && !lastEventIds.includes(m.id)) {
        const grid = worldToGrid(m.x, m.y, mapSize);
        let msg = "";
        let eventName = "";
        
        const region = getRegionName(m.x, m.y, mapSize);
        if (m.type === 5) {
          msg = this.formatMsg(steamId, ip, 'event_cargo_start', `Un Barco de Carga (Cargo Ship) está activo en {region} ({grid})`, { region, grid });
          eventName = "Cargo Ship";
        } else if (m.type === 4) {
          msg = this.formatMsg(steamId, ip, 'event_chinook_start', `Un Chinook CH-47 con caja fuerte está activo en {region} ({grid})`, { region, grid });
          eventName = "Chinook (CH47)";
        } else if (m.type === 8) {
          msg = this.formatMsg(steamId, ip, 'event_heli_start', `Un Helicóptero de Patrulla está activo en {region} ({grid})`, { region, grid });
          eventName = "Patrol";
        } else if (m.type === 6) {
           const isFar = Math.abs(m.x) > mapSize / 3 || Math.abs(m.y) > mapSize / 3;
           if (isFar) {
              msg = this.formatMsg(steamId, ip, 'event_oilrig_crate', `Oil Rig (Petro) activo en {grid}! Caja fuerte detectada.`, { grid });
              eventName = "Oil Rig (Petro)";
           } else {
              msg = this.formatMsg(steamId, ip, 'event_crate', `Caja Fuerte (Locked Crate) detectada en {grid}!`, { grid });
              eventName = "Caja Fuerte (Locked Crate)";
           }
        }
        
        if (msg) {
          this.botSendTeamMessage(steamId, ip, msg);
          this.addIntel(steamId, ip, 'EVENT', msg, { eventName, grid });
          
          // Alerta en Discord
          const serverObj = getServers(steamId).find((s: any) => s.ip === ip) as any;
          if (serverObj && (serverObj.discordWebhook || serverObj.discordChannelId)) {
            DiscordManager.sendEvent({
              webhookUrl: serverObj.discordWebhook,
              channelId: serverObj.discordChannelId
            }, eventName, grid, serverObj.name);
          }
        }
      }
      
      // Lógica específica para atraque de Cargo Ship
      if (m.type === 5 && harbors.length > 0) {
        const nearHarbor = harbors.find(h => {
          const dist = Math.sqrt(Math.pow(m.x - h.x, 2) + Math.pow(m.y - h.y, 2));
          return dist < 120; // Radio de atraque
        });

        if (nearHarbor && !dockedSet.has(m.id)) {
          const grid = worldToGrid(m.x, m.y, mapSize);
          const monumentName = nearHarbor.token.toUpperCase().replace(/_/g, ' ');
          const msg = this.formatMsg(steamId, ip, 'event_cargo_dock', `El Barco de Carga (Cargo Ship) ha atracado en {grid} ({monumentName})`, { grid, monumentName });
          this.botSendTeamMessage(steamId, ip, msg);
          this.addIntel(steamId, ip, 'EVENT', msg, { grid });
          dockedSet.add(m.id);
        } else if (!nearHarbor && dockedSet.has(m.id)) {
          // Salida de Harbor (con un margen extra para evitar oscilaciones)
          const minDockDist = harbors.reduce((min, h) => {
            const d = Math.sqrt(Math.pow(m.x - h.x, 2) + Math.pow(m.y - h.y, 2));
            return Math.min(min, d);
          }, Infinity);
          if (minDockDist > 150) {
            dockedSet.delete(m.id);
          }
        }
      }

      // 5. Detección Inteligente de Raids (Explosiones tipo 7)
      if (m.type === 7) {
        const grid = worldToGrid(m.x, m.y, mapSize);
        const now = Date.now();
        
        // Registrar explosión
        if (!this.lastExplosions.has(key)) this.lastExplosions.set(key, []);
        const explosions = this.lastExplosions.get(key)!;
        explosions.push({ grid, timestamp: now });
        
        // Limpiar explosiones viejas (> 5 min)
        const activeExplosions = explosions.filter(e => now - e.timestamp < 300000);
        this.lastExplosions.set(key, activeExplosions);
        
        // Contar explosiones en el mismo cuadrante
        const countInGrid = activeExplosions.filter(e => e.grid === grid).length;
        
        // Si hay más de 3 explosiones en 5 min en el mismo cuadrante, es un Raid probable
        if (countInGrid >= 3) {
           const alertKey = `${key}-${grid}-raid`;
           const lastRaidAlert = this.lastBaseAlerts.get(alertKey) || 0;
           if (now - lastRaidAlert > 600000) { // Alerta cada 10 min máximo por cuadrante
              const msg = this.formatMsg(steamId, ip, 'raid_alert', `¡ALERTA DE RAID POSIBLE en {grid}! Múltiples explosiones detectadas ({count}).`, { grid, count: countInGrid });
              this.botSendTeamMessage(steamId, ip, msg);
              this.addIntel(steamId, ip, 'RAID', msg, { grid, count: countInGrid });
              this.lastBaseAlerts.set(alertKey, now);
              
              // Notificar Discord
              const serverObj = getServers(steamId).find((s: any) => s.ip === ip) as any;
              if (serverObj && (serverObj.discordWebhook || serverObj.discordChannelId)) {
                try {
                  DiscordManager.sendRaidAlert({
                    webhookUrl: serverObj.discordWebhook,
                    channelId: serverObj.discordChannelId
                  }, grid, serverObj.name);
                } catch (e) {
                  console.error("[RustPlus] Error enviando alerta de raid a Discord:", e);
                }
              }
           }
        }
      }

      // 6. Detección en Tiempo Real de Vending Machines (Tipo 3)
      if (m.type === 3) {
        const grid = worldToGrid(m.x, m.y, mapSize);

        // Guardamos en la base de datos como respaldo para el buscador histórico
        const serverObj = getServers(steamId).find((s: any) => s.ip === ip) as any;
        if (serverObj) {
          saveVending(serverObj.id, {
            id: m.id.toString(),
            name: m.name || "Tienda",
            x: m.x,
            y: m.y,
            grid: grid,
            orders: JSON.stringify(m.sellOrders || [])
          });
        }

        // Lógica de Notificación Anti-Spam (Acumulación Temporal)
        const connectionTime = this.lastActivity.get(key) || 0;
        if (hasPreviousState && !lastEventIds.includes(m.id) && (Date.now() - connectionTime) > 30000) {
            if (!this.pendingVendingAlerts.has(key)) this.pendingVendingAlerts.set(key, []);
            this.pendingVendingAlerts.get(key)!.push({ name: m.name || "Tienda", grid });

            // Si no hay un temporizador activo para este servidor, iniciamos uno de 10 segundos
            if (!(this as any).vendingTimers) (this as any).vendingTimers = new Map();
            if (!(this as any).vendingTimers.has(key)) {
                const timer = setTimeout(() => {
                    const pending = this.pendingVendingAlerts.get(key) || [];
                    this.pendingVendingAlerts.set(key, []); // Limpiar cola
                    (this as any).vendingTimers.delete(key); // Limpiar timer

                    if (pending.length === 0) return;

                    if (pending.length > 2) {
                        const msg = this.formatMsg(steamId, ip, 'event_vending_batch', `📊 REPORTE LOGÍSTICO: {count} nuevas tiendas detectadas. Revisa el terminal web para detalles de stock.`, { count: pending.length });
                        this.botSendTeamMessage(steamId, ip, msg);
                    } else {
                        pending.forEach(p => {
                            const msg = this.formatMsg(steamId, ip, 'event_vending_new', `¡Nueva expendedora '{name}' en {grid}!`, { name: p.name, grid: p.grid });
                            this.botSendTeamMessage(steamId, ip, msg);
                        });
                    }
                }, 10000); // 10 SEGUNDOS DE ESPERA TÁCTICA
                (this as any).vendingTimers.set(key, timer);
            }
        }
      }
    });

    // Limpieza de barcos que ya no existen en el mapa
    for (const dId of Array.from(dockedSet)) {
      if (!currentCargoIds.includes(dId)) {
        dockedSet.delete(dId);
      }
    }

    this.lastMarkerStates.set(key, markers);
  }


  getPlayerHistory(steamId: string, ip: string) {
    const key = `${steamId}-${ip}`;
    const historyMap = this.playerHistory.get(key);
    if (!historyMap) return {};
    
    // Convertir Map a objeto plano para JSON
    const result: any = {};
    historyMap.forEach((path, sid) => {
      result[sid] = path;
    });
    return result;
  }

  getGlobalStats() {
    const activeServers = Array.from(this.connections.keys());
    return {
      activeConnections: activeServers.length,
      servers: activeServers.map(k => ({
        key: k,
        ready: this.ready.get(k),
        lastActivity: this.lastActivity.get(k),
        reconnectAttempts: this.reconnectAttempts.get(k) || 0
      }))
    };
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

  async checkProtos() {
    try {
      console.log("[RustPlus] Starting Self-Patching Protocol Check...");
      
      let libPath = '';
      try {
        libPath = path.dirname(require.resolve('@liamcottle/rustplus.js'));
        console.log(`[RustPlus] Library detected at: ${libPath}`);
      } catch (e) {
        console.warn("[RustPlus] Warning: Could not resolve library path for patching.");
      }

      const sourceProtos = [
        path.join(/*turbopackIgnore: true*/ process.cwd(), 'rustplus.proto'),
        path.join(/*turbopackIgnore: true*/ process.cwd(), 'node_modules/@liamcottle/rustplus.js/rustplus.proto'),
        path.join(/*turbopackIgnore: true*/ process.cwd(), 'resources/rustplus.proto'),
      ];

      if (libPath) {
        const targetProto = path.join(libPath, 'rustplus.proto');
        if (!fs.existsSync(targetProto) || fs.statSync(targetProto).size < 100) {
          for (const src of sourceProtos) {
            if (fs.existsSync(src)) {
              try {
                fs.copyFileSync(src, targetProto);
                console.log("[RustPlus] SUCCESS: Library patched with rustplus.proto.");
                break;
              } catch (copyErr) {}
            }
          }
        }
      }
    } catch (err) {
      console.error("[RustPlus] Error non-critical during proto check:", err);
    }
  }

  /**
   * Intenta reconectar todos los servidores guardados en la base de datos.
   */
  async reconnectAllServers() {
    console.log("[RustPlus Manager] Iniciando reconexión masiva de servidores...");
    try {
      const servers = db.prepare("SELECT * FROM servers").all() as any[];
      console.log(`[RustPlus Manager] Se encontraron ${servers.length} servidores configurados.`);
      
      for (const server of servers) {
        try {
          console.log(`[RustPlus Manager] Auto-reconectando a ${server.ip}...`);
          // Conectamos de forma asíncrona para no bloquear el arranque
          this.connect(server.steamId, {
            ip: server.ip,
            port: server.port,
            playerId: server.playerId,
            playerToken: server.playerToken
          }).catch(err => {
            console.error(`[RustPlus Manager] Error en auto-conexión a ${server.ip}:`, err.message);
          });
        } catch (serverErr) {
          console.error(`[RustPlus Manager] Fallo al procesar servidor ${server.ip}:`, serverErr);
        }
      }
    } catch (err) {
      console.error("[RustPlus Manager] Error crítico en reconnectAllServers:", err);
    }
  }

  private async handleReconnect(steamId: string, connection: ServerConnection) {
    const key = `${steamId}-${connection.ip}`;
    if (this.reconnectTimer.has(key)) return;

    const attempts = this.reconnectAttempts.get(key) || 0;
    const delay = Math.min(Math.pow(2, attempts) * 2000, 300000); // 2s, 4s, 8s... max 5min

    console.log(`[RustPlus] Reconexión automática en ${delay / 1000}s para ${connection.ip} (Intento ${attempts + 1})`);
    
    const timer = setTimeout(async () => {
      this.reconnectTimer.delete(key);
      this.reconnectAttempts.set(key, attempts + 1);
      try {
        await this.connect(steamId, connection);
      } catch (e) {
        // Silencioso, el evento disconnected volverá a disparar si falla
      }
    }, delay);

    this.reconnectTimer.set(key, timer);
  }

  private async processMessage(steamId: string, connection: ServerConnection, message: any) {
    // Traslado de la lógica pesada a este método asíncrono
    if (message.broadcast?.teamMessage) {
      const teamKey = `${steamId}-${connection.ip}`;
      const chatMsg = message.broadcast.teamMessage.message;
      
      const fullMsg = {
        steamId: String(chatMsg.steamId),
        name: chatMsg.name,
        message: chatMsg.message,
        color: chatMsg.color,
        time: Date.now()
      };

      const history = this.chatHistory.get(teamKey) || [];
      history.push(fullMsg);
      if (history.length > 100) history.shift();
      this.chatHistory.set(teamKey, history);

      try {
        const server = getServers(steamId).find((s: any) => s.ip === connection.ip) as any;
        if (server) {
          saveTeamMessage(server.id || `${steamId}-${connection.ip}`, fullMsg);
        }
      } catch (e) {}

      if (chatMsg.message.startsWith("!")) {
        this.handleTeamCommand(steamId, connection.ip, chatMsg.message);
      }
    }
    this.emit("message", { steamId, ip: connection.ip, message });
  }
}

// Singleton for the whole app (persists across requests in Next.js)
const globalStore = global as any;

export const rustPlusManager: RustPlusManager = globalStore._rustPlusManager || (globalStore._rustPlusManager = new RustPlusManager());

/**
 * Función de arranque seguro (Bootstrapping).
 * Se debe llamar desde instrumentation.ts para evitar ejecuciones durante el build.
 */
export async function bootstrap() {
  if (typeof window !== 'undefined') return;

  console.log("[RustPlus] Ejecutando Bootstrapping Operativo...");
  
  try {
    await rustPlusManager.checkProtos();
    
    // Reconectar servidores activos de la DB
    await rustPlusManager.reconnectAllServers();
    
    // Importación dinámica para evitar ciclos en el arranque
    const { FcmManager } = await import("../fcm/FcmManager");
    await FcmManager.initAllListeners();

    // Inicializar el Bot de Discord en segundo plano
    const { discordBotManager } = await import("../discord/DiscordBotManager");
    discordBotManager.init().catch(e => console.error("[Discord] Fallo al iniciar el bot:", e));
    
    console.log("[RustPlus] Bootstrapping completado con éxito.");
  } catch (err) {
    console.error("[RustPlus] Error durante el arranque táctico:", err);
  }
}
