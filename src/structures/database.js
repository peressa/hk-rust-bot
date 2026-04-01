const Database = require('better-sqlite3');
const Path = require('path');
const Fs = require('fs');

class DB {
    constructor() {
        const dbPath = Path.join(__dirname, '..', '..', 'data', 'rustplusplus_saas.db');
        const dbDir = Path.dirname(dbPath);
        
        if (!Fs.existsSync(dbDir)) {
            Fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new Database(dbPath);
        this.init();
    }

    init() {
        this.db.pragma('journal_mode = WAL'); // Mejor concurrencia

        // Tabla Usuarios (Logueados por Steam)
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                steam_id TEXT PRIMARY KEY,
                steam_name TEXT,
                fcm_credentials TEXT, -- Expo Push Token asignado al usuario (JSON)
                auth_token TEXT,      -- Token de autenticación de Facepunch
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Migración: Asegurar que existe la columna auth_token
        try {
            this.db.prepare('ALTER TABLE users ADD COLUMN auth_token TEXT').run();
        } catch(e) { /* Columna ya existe */ }

        // Tabla de Configuración y Enrutamiento de Discord
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS discord_guilds (
                guild_id TEXT PRIMARY KEY,
                steam_id_owner TEXT, -- Vinculado al usuario que invitó al bot
                alert_channel_id TEXT,
                chat_channel_id TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(steam_id_owner) REFERENCES users(steam_id) ON DELETE CASCADE
            )
        `).run();

        // Tabla de Servidores de Rust Vinculados (Multi-Tenant)
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS rust_servers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                steam_id_owner TEXT,
                rust_ip TEXT,
                rust_port TEXT,
                rust_server_id TEXT, -- ID interno del companion app
                player_token TEXT,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(steam_id_owner) REFERENCES users(steam_id) ON DELETE CASCADE,
                UNIQUE(steam_id_owner, rust_ip, rust_port)
            )
        `).run();
    }

    // ============================================
    // MÉTODOS DE USUARIOS
    // ============================================

    getUser(steamId) {
        return this.db.prepare('SELECT * FROM users WHERE steam_id = ?').get(steamId);
    }

    upsertUser(steamId, steamName, fcmCredentials = null, authToken = null) {
        const stmt = this.db.prepare(`
            INSERT INTO users (steam_id, steam_name, fcm_credentials, auth_token)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(steam_id) DO UPDATE SET
                steam_name = excluded.steam_name,
                fcm_credentials = COALESCE(excluded.fcm_credentials, users.fcm_credentials),
                auth_token = COALESCE(excluded.auth_token, users.auth_token)
        `);
        return stmt.run(steamId, steamName, fcmCredentials, authToken);
    }

    updateAuthToken(steamId, authToken) {
        return this.db.prepare('UPDATE users SET auth_token = ? WHERE steam_id = ?')
            .run(authToken, steamId);
    }

    updateUserFCM(steamId, fcmCredentials) {
        return this.db.prepare('UPDATE users SET fcm_credentials = ? WHERE steam_id = ?')
            .run(fcmCredentials ? JSON.stringify(fcmCredentials) : null, steamId);
    }

    // ============================================
    // MÉTODOS DE DISCORD GUILDS
    // ============================================

    getGuildConfig(guildId) {
        return this.db.prepare('SELECT * FROM discord_guilds WHERE guild_id = ?').get(guildId);
    }

    getGuildsByOwner(steamId) {
        return this.db.prepare('SELECT * FROM discord_guilds WHERE steam_id_owner = ?').all(steamId);
    }

    upsertGuildConfig(guildId, steamIdOwner, alertChannelId = null, chatChannelId = null) {
        const stmt = this.db.prepare(`
            INSERT INTO discord_guilds (guild_id, steam_id_owner, alert_channel_id, chat_channel_id, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(guild_id) DO UPDATE SET
                alert_channel_id = COALESCE(excluded.alert_channel_id, discord_guilds.alert_channel_id),
                chat_channel_id = COALESCE(excluded.chat_channel_id, discord_guilds.chat_channel_id),
                updated_at = CURRENT_TIMESTAMP
        `);
        return stmt.run(guildId, steamIdOwner, alertChannelId, chatChannelId);
    }

    // ============================================
    // MÉTODOS DE RUST SERVERS
    // ============================================

    getRustServersByOwner(steamId) {
        return this.db.prepare('SELECT * FROM rust_servers WHERE steam_id_owner = ?').all(steamId);
    }

    getAllActiveRustServers() {
        return this.db.prepare('SELECT * FROM rust_servers WHERE is_active = 1').all();
    }

    upsertRustServer(steamIdOwner, ip, port, serverId, playerToken) {
        const stmt = this.db.prepare(`
            INSERT INTO rust_servers (steam_id_owner, rust_ip, rust_port, rust_server_id, player_token)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(steam_id_owner, rust_ip, rust_port) DO UPDATE SET
                rust_server_id = excluded.rust_server_id,
                player_token = excluded.player_token,
                is_active = 1
        `);
        return stmt.run(steamIdOwner, ip, port, serverId, playerToken);
    }

    toggleRustServerStatus(id, isActive) {
        return this.db.prepare('UPDATE rust_servers SET is_active = ? WHERE id = ?')
            .run(isActive ? 1 : 0, id);
    }

    deleteRustServer(id) {
        return this.db.prepare('DELETE FROM rust_servers WHERE id = ?').run(id);
    }
}

module.exports = new DB();
