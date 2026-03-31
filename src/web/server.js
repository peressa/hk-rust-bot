/*
    [MÓDULO 5] - Web Dashboard (Express + Steam Auth)
    Esqueleto del servidor web para configurar bots desde una interfaz gráfica.
*/

const express = require('express');
// TODO: Instalar dependencias requeridas usando:
// npm install express express-session passport passport-steam

// Comentado para no crashear hasta que se instalen:
// const session = require('express-session');
// const passport = require('passport');
// const SteamStrategy = require('passport-steam').Strategy;

const routes = require('./routes');

class WebDashboard {
    constructor(client) {
        this.client = client;
        this.app = express();
        this.port = process.env.WEB_PORT || 3000;
        this.hostUrl = process.env.HOST_URL || `http://localhost:${this.port}`;
        
        // Descomentar cuando se instalen las dependencias:
        // this._setupPassport();
        // this._setupMiddleware();
        this._setupRoutes();
    }

    _setupPassport() {
        const passport = require('passport');
        const SteamStrategy = require('passport-steam').Strategy;

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
                // Aquí se verifica el ID de Steam en la base de datos de usuarios autorizados
                profile.identifier = identifier;
                return done(null, profile);
            }));
        } else {
            console.warn("[Web Dashboard] Falta STEAM_API_KEY. El login por Steam no funcionará.");
        }
    }

    _setupMiddleware() {
        const session = require('express-session');
        const passport = require('passport');

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

        // Middleware para inyectar el Discord Client en los requests
        this.app.use((req, res, next) => {
            req.discordClient = this.client;
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
