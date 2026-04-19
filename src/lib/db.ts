import Database from "better-sqlite3";
import path from "path";

import fs from "fs";

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
`);

// Patcheo dinámico de esquema por si la DB ya existía sin estas columnas (Migración silente)
try {
  db.exec("ALTER TABLE map_cache ADD COLUMN oceanMargin INTEGER DEFAULT 0;");
} catch(e) {}
try { db.exec("ALTER TABLE map_cache ADD COLUMN mapSize INTEGER;"); } catch (e) {}
try { db.exec("ALTER TABLE map_cache ADD COLUMN monuments TEXT;"); } catch (e) {}
try {
  db.exec("ALTER TABLE servers ADD COLUMN discordWebhook TEXT;");
} catch(e) {}
try {
  db.exec("ALTER TABLE servers ADD COLUMN bmId TEXT;");
} catch(e) {}
try { db.exec("ALTER TABLE war_room_invites ADD COLUMN name TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE war_room_invites ADD COLUMN expiresAt TEXT;"); } catch (e) {}
try {
  db.exec("ALTER TABLE servers ADD COLUMN discordChannelId TEXT;");
} catch(e) {}
try {
  db.exec("ALTER TABLE entities ADD COLUMN value INTEGER DEFAULT 0;");
} catch(e) {}
try {
  db.exec("ALTER TABLE entities ADD COLUMN capacity REAL DEFAULT 0;");
} catch(e) {}
try {
  db.exec("ALTER TABLE entities ADD COLUMN hasCapacity INTEGER DEFAULT 0;");
} catch(e) {}
try {
  db.exec("ALTER TABLE servers ADD COLUMN botPrefix TEXT DEFAULT ':exclamation:';");
} catch(e) {}
try {
  db.exec("ALTER TABLE servers ADD COLUMN botTemplates TEXT;"); -- JSON string
} catch(e) {}

// MIGRACIÓN CRÍTICA: Borrar caché de mapas con oceanMargin=0 (datos incorrectos).
// Con el fix de RustPlusManager, los mapas ahora calculan oceanMargin desde map.width - mapSize.
// Los registros viejos con oceanMargin=0 se borran para forzar re-descarga correcta.
try {
  const deleted = db.prepare("DELETE FROM map_cache WHERE oceanMargin = 0 OR oceanMargin IS NULL").run();
  if (deleted.changes > 0) {
    console.log(`[DB Migration] Eliminados ${deleted.changes} caché(s) de mapa con oceanMargin incorrecto (0). Se re-descargarán correctamente.`);
  }
} catch(e) {}


// === Whitelist Admin Inicial ===
try {
  const adminId = "76561197960580123";
  const stmt = db.prepare("INSERT OR IGNORE INTO whitelist (steamId, name, role, createdAt) VALUES (?, ?, ?, ?)");
  stmt.run(adminId, "Admin Principal", "admin", new Date().toISOString());
} catch(e) {}


export function saveServer(server: any) {
  // Validación crítica: No guardar si faltan tokens (notificaciones de muerte, etc.)
  if (!server.playerId || !server.playerToken || String(server.playerId) === "undefined") {
    console.warn(`[DB] Ignorando grabación de servidor incompleto (Death/Event notification) para ${server.ip}`);
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
    server.botTemplates ? JSON.stringify(server.botTemplates) : null
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

export function getMapCache(serverId: string) {
  const row = db.prepare("SELECT * FROM map_cache WHERE serverId = ?").get(serverId) as any;
  if (!row) return null;
  // NO defaultear oceanMargin a 0 — si es 0. es un dato incorrecto y el caller lo rechazará
  return {
    jpgImage: row.jpgImage,
    width: row.width,
    height: row.height,
    mapSize: row.mapSize,
    oceanMargin: row.oceanMargin,
    monuments: row.monuments ? JSON.parse(row.monuments) : [],
    updatedAt: row.updatedAt
  };
}

export function clearMapCache(serverId: string) {
  const stmt = db.prepare("DELETE FROM map_cache WHERE serverId = ?");
  stmt.run(serverId);
}

export function getServers(steamId: string) {
  const stmt = db.prepare("SELECT * FROM servers WHERE steamId = ?");
  return stmt.all(steamId);
}

export function saveEntity(entity: any) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO entities (id, steamId, serverId, entityId, entityType, name, value, capacity, hasCapacity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    `${entity.steamId}-${entity.serverId}-${entity.entityId}`, 
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

export function getEntities(steamId: string, serverId: string) {
  const stmt = db.prepare("SELECT * FROM entities WHERE steamId = ? AND serverId = ?");
  return stmt.all(steamId, serverId);
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
export function isWhitelisted(steamId: string): any | null {
  if (!steamId) return null;
  const stmt = db.prepare("SELECT * FROM whitelist WHERE steamId = ?");
  const row = stmt.get(steamId) as any;
  
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

export function getAllWhitelisted() {
  const stmt = db.prepare("SELECT * FROM whitelist ORDER BY createdAt DESC");
  return stmt.all();
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

export default db;

