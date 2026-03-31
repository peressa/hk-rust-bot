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
        this.hostUrl = (process.env.HOST_URL || `http://localhost:${this.port}`).replace(/\/$/, "");
        
        this._setupPassport();
        this._setupMiddleware();
        this._setupRoutes();
        this._setupErrorHandling();
    }

    _setupPassport() {
        passport.serializeUser((user, done) => {
            done(null, user);
        });

        passport.deserializeUser((obj, done) => {
            done(null, obj);
        });

        const apiKey = process.env.STEAM_API_KEY;
        this.steamStrategyActive = false;

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
            this.steamStrategyActive = true;
        } else {
            console.warn("[Web Dashboard] ADVERTENCIA: Falta STEAM_API_KEY. El login por Steam no funcionará.");
        }
    }

    _setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static('public'));
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'rustplusplus_secret_dashboard_key_2024',
            name: 'rustplusplus.session',
            resave: true,
            saveUninitialized: true,
            cookie: {
                secure: this.hostUrl.startsWith('https'),
                maxAge: 24 * 60 * 60 * 1000 // 24 horas
            }
        }));

        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Inyectar BotManager y estado de estrategia en los requests
        this.app.use((req, res, next) => {
            req.botManager = BotManager;
            req.steamStrategyActive = this.steamStrategyActive;
            next();
        });
    }

    _setupErrorHandling() {
        // Manejador de errores global
        this.app.use((err, req, res, next) => {
            console.error('[Web Dashboard Error]', err);
            res.status(500).json({
                error: 'Internal Server Error',
                message: err.message,
                tip: err.message.includes('Unknown authentication strategy') ? 
                    'Asegúrate de configurar STEAM_API_KEY en tu archivo .env' : undefined
            });
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
