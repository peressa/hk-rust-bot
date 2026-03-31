const Database = require('better-sqlite3');
const Path = require('path');
const Fs = require('fs');

class DB {
    constructor() {
        const dbPath = Path.join(__dirname, '..', '..', 'data', 'rustplusplus.db');
        const dbDir = Path.dirname(dbPath);
        
        if (!Fs.existsSync(dbDir)) {
            Fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new Database(dbPath);
        this.init();
    }

    init() {
        // Tabla de tenants (usuarios/bots)
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS tenants (
                steam_id TEXT PRIMARY KEY,
                username TEXT,
                discord_token TEXT,
                rust_ip TEXT,
                rust_port TEXT,
                rust_steam_id TEXT,
                rust_token TEXT,
                bot_status INTEGER DEFAULT 0, -- 0: Stopped, 1: Running
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Tabla de configuraciones adicionales si fuera necesario
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS bot_configs (
                steam_id TEXT PRIMARY KEY,
                config_json TEXT,
                FOREIGN KEY(steam_id) REFERENCES tenants(steam_id)
            )
        `).run();
    }

    // Métodos de utilidad
    getTenant(steamId) {
        return this.db.prepare('SELECT * FROM tenants WHERE steam_id = ?').get(steamId);
    }

    getAllActiveTenants() {
        return this.db.prepare('SELECT * FROM tenants WHERE bot_status = 1').all();
    }

    upsertTenant(steamId, username, discordToken) {
        const stmt = this.db.prepare(`
            INSERT INTO tenants (steam_id, username, discord_token, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(steam_id) DO UPDATE SET
                username = excluded.username,
                discord_token = COALESCE(excluded.discord_token, tenants.discord_token),
                updated_at = CURRENT_TIMESTAMP
        `);
        return stmt.run(steamId, username, discordToken);
    }

    updateRustConfig(steamId, config) {
        const stmt = this.db.prepare(`
            UPDATE tenants SET
                rust_ip = ?,
                rust_port = ?,
                rust_steam_id = ?,
                rust_token = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE steam_id = ?
        `);
        return stmt.run(config.ip, config.port, config.steamId, config.token, steamId);
    }

    updateBotStatus(steamId, status) {
        return this.db.prepare('UPDATE tenants SET bot_status = ?, updated_at = CURRENT_TIMESTAMP WHERE steam_id = ?')
            .run(status, steamId);
    }
}

module.exports = new DB();
