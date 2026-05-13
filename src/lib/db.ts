import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { DbServer, DbEntity, DbMapCache, DbWhitelist } from "../types/db";

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, "rust-plus.db");
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    steamId TEXT,
    ip TEXT,
    port TEXT,
    playerId TEXT,
    playerToken TEXT,
    name TEXT,
    useProxy INTEGER DEFAULT 0,
    discordWebhook TEXT,
    UNIQUE(steamId, ip)
  );

  CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    steamId TEXT,
    serverId TEXT,
    entityId TEXT,
    entityType INTEGER,
    name TEXT,
    UNIQUE(steamId, serverId, entityId)
  );

  CREATE TABLE IF NOT EXISTS fcm_keys (
    steamId TEXT PRIMARY KEY,
    keys TEXT, -- JSON string
    deviceId TEXT -- UUID for Facepunch identification
  );

  CREATE TABLE IF NOT EXISTS map_cache (
    serverId TEXT PRIMARY KEY,
    jpgImage TEXT, -- Bloque Base64 de la imagen
    width INTEGER,
    height INTEGER,
    mapSize INTEGER,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS death_markers (
    steamId TEXT,
    serverId TEXT,
    name TEXT,
    x REAL,
    y REAL,
    timestamp TEXT, -- Timestamp ISO para borrar los viejos
    PRIMARY KEY(steamId, serverId)
  );

  CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY,
    steamId TEXT,
    serverId TEXT,
    identifier TEXT,
    name TEXT,
    UNIQUE(steamId, serverId, identifier)
  );

  CREATE TABLE IF NOT EXISTS whitelist (
    steamId TEXT PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'user', -- 'user' or 'admin'
    expiresAt TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS war_room_invites (
    id TEXT PRIMARY KEY,
    serverId TEXT,
    name TEXT,
    code TEXT,
    targetWipeTime INTEGER, -- Invalida el link tras Wipe
    expiresAt TEXT,
    canDraw INTEGER DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS map_drawings (
    id TEXT PRIMARY KEY,
    serverId TEXT,
    steamId TEXT,
    data TEXT, -- JSON con puntos del trazo
    color TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS team_chat (
    id TEXT PRIMARY KEY,
    serverId TEXT,
    steamId TEXT,
    name TEXT,
    message TEXT,
    color TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS vending_machines (
    id TEXT PRIMARY KEY,
    serverId TEXT,
    name TEXT,
    x REAL,
    y REAL,
    grid TEXT,
    orders TEXT,
    lastUpdate INTEGER
  );

  CREATE TABLE IF NOT EXISTS tracking_targets (
    id TEXT PRIMARY KEY,
    serverId TEXT,
    steamId TEXT,
    name TEXT,
    isOnline INTEGER DEFAULT 0,
    lastSeen INTEGER,
    UNIQUE(serverId, steamId)
  );
`);

// Helper para migraciones seguras
function addColumnIfNotExists(table: string, column: string, definition: string) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  } catch (e) {
    // Ignorar si la columna ya existe
  }
}

// Ejecutar Migraciones
addColumnIfNotExists("map_cache", "oceanMargin", "INTEGER DEFAULT 0");
addColumnIfNotExists("map_cache", "mapSize", "INTEGER");
addColumnIfNotExists("map_cache", "monuments", "TEXT");
addColumnIfNotExists("servers", "discordWebhook", "TEXT");
addColumnIfNotExists("servers", "bmId", "TEXT");
addColumnIfNotExists("servers", "discordChannelId", "TEXT");
addColumnIfNotExists("servers", "botPrefix", "TEXT DEFAULT ':exclamation:'");
addColumnIfNotExists("servers", "botTemplates", "TEXT");
addColumnIfNotExists("war_room_invites", "name", "TEXT");
addColumnIfNotExists("war_room_invites", "expiresAt", "TEXT");
addColumnIfNotExists("entities", "value", "INTEGER DEFAULT 0");
addColumnIfNotExists("entities", "capacity", "REAL DEFAULT 0");
addColumnIfNotExists("entities", "hasCapacity", "INTEGER DEFAULT 0");
addColumnIfNotExists("whitelist", "discordId", "TEXT");

// MIGRACIÓN: Purgar caché para aplicar lógica PROFESIONAL de Píxeles vs Metros (como RustPlusBot)
try {
  db.prepare("DELETE FROM map_cache").run();
  console.log("[DB Migration] Purgando caché para aplicar proyección exacta píxel/metro.");
} catch(e) {}


// === Whitelist Admin Inicial ===
export function ensureAdminExists() {
  try {
    const envAdminId = process.env.ADMIN_STEAM_ID?.trim();
    // Fallback explícito para el usuario si la variable de entorno falla
    const adminId = envAdminId || "76561198037219800"; 

    console.log(`[DB] Asegurando Admin Principal: ${adminId} ${envAdminId ? '(desde ENV)' : '(FALLBACK)'}`);
    
    // Usamos INSERT OR REPLACE para asegurar que si el ID cambia en el ENV, se actualice el rol a admin
    const stmt = db.prepare("INSERT OR REPLACE INTO whitelist (steamId, name, role, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)");
    stmt.run(envAdminId, "Admin Principal", "admin", null, new Date().toISOString());
  } catch(e) {
    console.error("[DB] Error asegurando admin:", e);
  }
}

// Ejecutar al cargar el módulo
ensureAdminExists();


export function saveServer(server: Partial<DbServer> & { ip: string, port: string, playerId: string, playerToken: string }) {
  // Validación crítica: No guardar si faltan tokens
  if (!server.playerId || !server.playerToken || String(server.playerId) === "undefined") {
    console.warn(`[DB] Ignorando grabación de servidor incompleto para ${server.ip}`);
    return;
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO servers (id, steamId, ip, port, playerId, playerToken, name, useProxy, discordWebhook, discordChannelId, bmId, botPrefix, botTemplates)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    server.id || `${server.steamId}-${server.ip}`, 
    server.steamId, 
    server.ip, 
    server.port, 
    String(server.playerId), 
    String(server.playerToken), 
    server.name,
    server.useProxy ? 1 : 0,
    server.discordWebhook || null,
    server.discordChannelId || null,
    server.bmId || null,
    server.botPrefix || ':exclamation:',
    server.botTemplates ? (typeof server.botTemplates === 'string' ? server.botTemplates : JSON.stringify(server.botTemplates)) : null
  );
}

export function saveMapCache(serverId: string, data: { jpgImage: string, width: number, height: number, monuments: any[], mapSize: number, oceanMargin: number }) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO map_cache (serverId, jpgImage, width, height, monuments, mapSize, oceanMargin, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const monumentsJson = JSON.stringify(data.monuments);
  stmt.run(serverId, data.jpgImage, data.width, data.height, monumentsJson, data.mapSize, data.oceanMargin, new Date().toISOString());
}

export function getMapCache(serverId: string): (Omit<DbMapCache, 'monuments'> & { monuments: any[] }) | null {
  const row = db.prepare("SELECT * FROM map_cache WHERE serverId = ?").get(serverId) as DbMapCache | undefined;
  if (!row) return null;
  return {
    ...row,
    monuments: row.monuments ? JSON.parse(row.monuments) : [],
  };
}

export function clearMapCache(serverId: string) {
  const stmt = db.prepare("DELETE FROM map_cache WHERE serverId = ?");
  stmt.run(serverId);
}

export function getServers(steamId: string): DbServer[] {
  const stmt = db.prepare("SELECT * FROM servers WHERE steamId = ?");
  return stmt.all(steamId) as DbServer[];
}

export function saveEntity(entity: DbEntity) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO entities (id, steamId, serverId, entityId, entityType, name, value, capacity, hasCapacity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    entity.id || `${entity.steamId}-${entity.serverId}-${entity.entityId}`, 
    entity.steamId, 
    entity.serverId, 
    entity.entityId, 
    entity.entityType, 
    entity.name,
    entity.value ? 1 : 0,
    entity.capacity || 0,
    entity.hasCapacity ? 1 : 0
  );
}

export function getEntities(steamId: string, serverId: string): DbEntity[] {
  const stmt = db.prepare("SELECT * FROM entities WHERE steamId = ? AND serverId = ?");
  return stmt.all(steamId, serverId) as DbEntity[];
}

// === Death Markers ===
export function saveDeathMarker(steamId: string, serverId: string, name: string, x: number, y: number): boolean {
  // Check rate limit para no hacer spam (5 minutos)
  const recentCutoff = new Date(Date.now() - 300000).toISOString();
  const existing = db.prepare("SELECT * FROM death_markers WHERE steamId = ? AND serverId = ? AND timestamp > ?").get(steamId, serverId, recentCutoff);
  
  if (existing) {
    return false; // Ya notificamos esta muerte recientemente
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO death_markers (steamId, serverId, name, x, y, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(steamId, serverId, name, x, y, new Date().toISOString());
  return true; // Es nueva muerte
}

export function getDeathMarkers(serverId: string) {
  // Limpiar muertes más antiguas a 4 horas (14400000 ms)
  const cutoff = new Date(Date.now() - 14400000).toISOString();
  db.prepare("DELETE FROM death_markers WHERE serverId = ? AND timestamp < ?").run(serverId, cutoff);

  const stmt = db.prepare("SELECT * FROM death_markers WHERE serverId = ?");
  return stmt.all(serverId);
}

// === Cameras ===
export function saveCamera(steamId: string, serverId: string, identifier: string, name: string) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO cameras (id, steamId, serverId, identifier, name)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(`${steamId}-${serverId}-${identifier}`, steamId, serverId, identifier, name);
}

export function getCameras(steamId: string, serverId: string) {
  const stmt = db.prepare("SELECT * FROM cameras WHERE steamId = ? AND serverId = ?");
  return stmt.all(steamId, serverId);
}

export function deleteCamera(cameraId: string) {
  const stmt = db.prepare("DELETE FROM cameras WHERE id = ?");
  stmt.run(cameraId);
}

// === Whitelist Functions ===
export function isWhitelisted(steamId: string): DbWhitelist | null {
  if (!steamId) return null;
  const cleanId = String(steamId).trim();
  const stmt = db.prepare("SELECT * FROM whitelist WHERE steamId = ?");
  const row = stmt.get(cleanId) as DbWhitelist | undefined;
  
  if (!row) return null;

  // Verificar si ha expirado
  if (row.expiresAt) {
    const expires = new Date(row.expiresAt);
    if (expires < new Date()) {
      console.warn(`[Whitelist] Licencia de ${steamId} expirada el ${row.expiresAt}`);
      return null;
    }
  }

  return row;
}

export function getAllWhitelisted(): DbWhitelist[] {
  const stmt = db.prepare("SELECT * FROM whitelist ORDER BY createdAt DESC");
  return stmt.all() as DbWhitelist[];
}

export function addToWhitelist(steamId: string, name: string = "User", role: string = "user", days: number = 0) {
  let expiresAt = null;
  if (days > 0) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    expiresAt = date.toISOString();
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO whitelist (steamId, name, role, expiresAt, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(steamId, name, role, expiresAt, new Date().toISOString());
}

export function linkDiscordId(steamId: string, discordId: string) {
  const cleanSteamId = String(steamId).trim();
  const cleanDiscordId = String(discordId).trim();
  
  const stmt = db.prepare("UPDATE whitelist SET discordId = ? WHERE steamId = ?");
  const result = stmt.run(cleanDiscordId, cleanSteamId);
  
  if (result.changes > 0) {
    console.log(`[DB] Vínculo exitoso: Steam ${cleanSteamId} -> Discord ${cleanDiscordId}`);
    return true;
  } else {
    // Si falla el update, puede que el usuario no esté en la tabla (común en primer inicio)
    console.warn(`[DB] Fallo al vincular: No se encontró SteamID ${cleanSteamId}. Intentando inserción de emergencia...`);
    
    // Si es el admin de las variables de entorno, lo creamos
    if (cleanSteamId === process.env.ADMIN_STEAM_ID?.trim()) {
      db.prepare("INSERT OR REPLACE INTO whitelist (steamId, name, role, discordId, createdAt) VALUES (?, ?, ?, ?, ?)")
        .run(cleanSteamId, "Admin Principal", "admin", cleanDiscordId, new Date().toISOString());
      console.log(`[DB] Admin vinculado y creado con éxito.`);
      return true;
    }
  }
  return false;
}

export function getWhitelistByDiscordId(discordId: string): DbWhitelist | null {
  const stmt = db.prepare("SELECT * FROM whitelist WHERE discordId = ?");
  return stmt.get(discordId) as DbWhitelist | undefined || null;
}

export function saveVending(serverId: string, vending: { id: string, name: string, x: number, y: number, grid: string, orders: string }) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO vending_machines (id, serverId, name, x, y, grid, orders, lastUpdate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(vending.id, serverId, vending.name, vending.x, vending.y, vending.grid, vending.orders, Date.now());
}

export function getVendings(serverId: string) {
  return db.prepare("SELECT * FROM vending_machines WHERE serverId = ? ORDER BY lastUpdate DESC").all(serverId) as any[];
}

export function removeFromWhitelist(steamId: string) {
  const stmt = db.prepare("DELETE FROM whitelist WHERE steamId = ? AND role != 'admin'");
  stmt.run(steamId);
}

// === War Room Invites ===
export function createInvite(serverId: string, name: string, code: string, targetWipeTime: number, expiresAt: string | null, canDraw: boolean) {
    const id = Math.random().toString(36).substring(2, 11);
    const stmt = db.prepare(`
        INSERT INTO war_room_invites (id, serverId, name, code, targetWipeTime, expiresAt, canDraw, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, serverId, name, code, targetWipeTime, expiresAt, canDraw ? 1 : 0, new Date().toISOString());
    return id;
}

export function getInvite(id: string) {
    const stmt = db.prepare("SELECT * FROM war_room_invites WHERE id = ?");
    return stmt.get(id);
}

export function deleteInvite(id: string) {
    const stmt = db.prepare("DELETE FROM war_room_invites WHERE id = ?");
    stmt.run(id);
}

export function getInvitesByServer(serverId: string) {
    const stmt = db.prepare("SELECT * FROM war_room_invites WHERE serverId = ?");
    return stmt.all(serverId);
}

// === Team Chat ===
export function saveTeamMessage(serverId: string, msg: any) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO team_chat (id, serverId, steamId, name, message, color, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const id = `${serverId}-${msg.steamId}-${msg.time || Date.now()}`;
  stmt.run(id, serverId, String(msg.steamId), msg.name, msg.message, msg.color || '', msg.time || Date.now());
}

export function getTeamChat(serverId: string, limit = 50) {
  const stmt = db.prepare("SELECT * FROM team_chat WHERE serverId = ? ORDER BY timestamp DESC LIMIT ?");
  const rows = stmt.all(serverId, limit);
  return rows.reverse();
}

// === Tracking Targets ===
export function addTrackingTarget(serverId: string, steamId: string, name: string) {
  const id = `${serverId}-${steamId}`;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tracking_targets (id, serverId, steamId, name, isOnline, lastSeen)
    VALUES (?, ?, ?, ?, 0, ?)
  `);
  stmt.run(id, serverId, steamId, name, Date.now());
}

export function getTrackingTargets(serverId: string) {
  const stmt = db.prepare("SELECT * FROM tracking_targets WHERE serverId = ?");
  return stmt.all(serverId) as any[];
}

export function removeTrackingTarget(serverId: string, steamId: string) {
  const stmt = db.prepare("DELETE FROM tracking_targets WHERE serverId = ? AND steamId = ?");
  stmt.run(serverId, steamId);
}

export function updateTrackingStatus(serverId: string, steamId: string, isOnline: boolean) {
  const stmt = db.prepare("UPDATE tracking_targets SET isOnline = ?, lastSeen = ? WHERE serverId = ? AND steamId = ?");
  stmt.run(isOnline ? 1 : 0, Date.now(), serverId, steamId);
}

export default db;

