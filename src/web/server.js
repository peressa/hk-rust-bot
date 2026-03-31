const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const routes = require('./routes');
const BotManager = require('../structures/BotManager');
const db = require('../structures/database');

class WebDashboard {
    constructor() {
        this.app = express();
        this.port = process.env.WEB_PORT || 3000;
        this.hostUrl = process.env.HOST_URL || `http://localhost:${this.port}`;
        
        this._setupPassport();
        this._setupMiddleware();
        this._setupRoutes();
    }

    _setupPassport() {
        passport.serializeUser((user, done) => {
            done(null, user);
        });

        passport.deserializeUser((obj, done) => {
            done(null, obj);
        });

        const apiKey = process.env.STEAM_API_KEY;
        if (apiKey && apiKey !== "TU_STEAM_API_KEY_AQUI") {
            passport.use(new SteamStrategy({
                returnURL: `${this.hostUrl}/auth/steam/return`,
                realm: `${this.hostUrl}/`,
                apiKey: apiKey
            }, (identifier, profile, done) => {
                // Sincronizar usuario con la base de datos local
                db.upsertTenant(profile.id, profile.displayName, null);
                profile.identifier = identifier;
                return done(null, profile);
            }));
        } else {
            console.warn("[Web Dashboard] Falta STEAM_API_KEY. El login por Steam no funcionará.");
        }
    }

    _setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(session({
            secret: 'rustplusplus_secret_dashboard_key_2024',
            name: 'rustplusplus.session',
            resave: true,
            saveUninitialized: true
        }));

        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Inyectar BotManager en los requests
        this.app.use((req, res, next) => {
            req.botManager = BotManager;
            next();
        });
    }

    _setupRoutes() {
        this.app.use('/', routes);
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`[Web Dashboard] Iniciado localmente en ${this.hostUrl}`);
            console.log(`[Web Dashboard] Login de Steam disponible en ${this.hostUrl}/auth/steam`);
        });
    }
}

module.exports = WebDashboard;
