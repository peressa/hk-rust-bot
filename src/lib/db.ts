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
    keys TEXT -- JSON string
  );
`);

export default db;

export function saveServer(server: any) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO servers (id, steamId, ip, port, playerId, playerToken, name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(server.id || `${server.steamId}-${server.ip}`, server.steamId, server.ip, server.port, server.playerId, server.playerToken, server.name);
}

export function getServers(steamId: string) {
  const stmt = db.prepare("SELECT * FROM servers WHERE steamId = ?");
  return stmt.all(steamId);
}

export function saveEntity(entity: any) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO entities (id, steamId, serverId, entityId, entityType, name)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(`${entity.steamId}-${entity.serverId}-${entity.entityId}`, entity.steamId, entity.serverId, entity.entityId, entity.entityType, entity.name);
}

export function getEntities(steamId: string, serverId: string) {
  const stmt = db.prepare("SELECT * FROM entities WHERE steamId = ? AND serverId = ?");
  return stmt.all(steamId, serverId);
}
