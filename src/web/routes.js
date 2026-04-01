const express = require('express');
const router = express.Router();
const db = require('../structures/database');
const passport = require('passport');
const path = require('path');

// Middleware para verificar si el usuario está logueado
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'No autorizado. Por favor inicia sesión.' });
    }
    res.redirect('/auth/steam');
}

// ============================================
// RUTAS DE AUTENTICACIÓN (STEAM)
// ============================================

router.get('/auth/steam', (req, res, next) => {
    if (!req.steamStrategyActive) {
        return res.status(503).json({ 
            error: 'Servicio no disponible', 
            message: 'Steam login no está configurado.' 
        });
    }
    passport.authenticate('steam', { failureRedirect: '/' })(req, res, next);
});

router.get('/auth/steam/return', (req, res, next) => {
    if (!req.steamStrategyActive) {
        return res.redirect('/');
    }
    passport.authenticate('steam', { failureRedirect: '/' })(req, res, () => {
        res.redirect('/panel');
    });
});

router.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        res.redirect('/');
    });
});

// ============================================
// RUTAS DE LA API SAAS
// ============================================

// Ver mi información y mis servidores vinculados
router.get('/api/me', ensureAuthenticated, (req, res) => {
    const user = db.getUser(req.user.id);
    const servers = db.getRustServersByOwner(req.user.id);
    const guilds = db.getGuildsByOwner(req.user.id);

    // Bandera de super admin (Temporal / .env configurado)
    const isAdmin = (req.user.id === process.env.OWNER_STEAM_ID);

    res.json({
        user: {
            steamId: req.user.id,
            displayName: req.user.displayName,
            avatar: (req.user.photos && req.user.photos.length > 2) ? req.user.photos[2].value : null,
            isLinkedFCM: !!(user && user.fcm_credentials),
            isAdmin: isAdmin
        },
        servers: servers,
        guilds: guilds
    });
});

// Configurar canales de Discord
router.post('/api/discord/guild/config', ensureAuthenticated, express.json(), (req, res) => {
    const { guild_id, alert_channel_id, chat_channel_id } = req.body;
    db.upsertGuildConfig(guild_id, req.user.id, alert_channel_id, chat_channel_id);
    res.json({ success: true });
});

// Admin Stats
router.get('/api/admin/stats', ensureAuthenticated, (req, res) => {
    if(req.user.id !== process.env.OWNER_STEAM_ID) {
       return res.status(403).json({ error: 'Superadmin only.' });
    }

    const memoryInfo = process.memoryUsage();
    let wsCount = 0;
    if(global.hkBot && global.hkBot.rustplusInstances) {
        wsCount = Object.keys(global.hkBot.rustplusInstances).length;
    }

    res.json({
        memory: Math.round(memoryInfo.rss / 1024 / 1024) + ' MB',
        rustPlusSockets: wsCount,
        registeredUsers: db.db.prepare('SELECT count(*) as c FROM users').get().c,
        registeredServers: db.db.prepare('SELECT count(*) as c FROM rust_servers').get().c
    });
});

// Generar o recuperar una solicitud de emparejamiento (Zero-Friction FCM)
router.post('/api/pair/init', ensureAuthenticated, express.json(), async (req, res) => {
    try {
        const { authToken } = req.body;
        const user = db.getUser(req.user.id);
        
        // Priorizar el nuevo token si se provee, o usar el existente
        const finalAuthToken = authToken || (user ? user.auth_token : null);
        
        if (authToken) {
            db.updateAuthToken(req.user.id, authToken);
        }

        if (!user || !user.fcm_credentials || authToken) {
            // Si es nuevo o estamos actualizando el token, registramos/re-vinculamos
            console.log(`[API] Iniciando registro/re-vinculación FCM para ${req.user.id}`);
            await global.fcmManager.registerNewDevice(req.user.id);
        } else {
            // Si ya existe y no hay token nuevo, simplemente aseguramos que el listener esté vivo
            console.log(`[API] Re-activando listener existente para ${req.user.id}`);
            global.fcmManager.startListenerForUser(req.user.id, JSON.parse(user.fcm_credentials));
        }

        res.json({ 
            message: 'HK Rust Protector Activo', 
            status: 'ready',
            isLinked: true 
        });
    } catch(err) {
        console.error('[API] Error on FCM registration:', err);
        res.status(500).json({ error: 'Error de vinculación', message: err.toString() });
    }
});

// ============================================
// SERVER-SENT EVENTS (SSE) - LIVE COMBAT LOG
// ============================================

// Mapa global para guardar clientes del navegador conectados (SteamID -> res obj)
const sseClients = new Map();
global.sseClients = sseClients;

// Ruta para subscribir el navegador web al feed en tiempo real de asesinatos
router.get('/api/events/combatlog', ensureAuthenticated, (req, res) => {
    // Mantener la conexión abierta con Headers HTTP de SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Enviar primer evento conectivo
    res.write(`data: ${JSON.stringify({ type: 'connected', msg: 'Conexión a Rust+ Killfeed establecida.' })}\n\n`);

    // Añadir el objeto de respuesta del usuario a la lista global para inyectar datos
    sseClients.set(req.user.id, res);

    // Cuando el usuario cierre el navegador, borrarlo de la lista
    req.on('close', () => {
        sseClients.delete(req.user.id);
    });
});

// ============================================
// SISTEMA DE VINCULACIÓN EN TIEMPO REAL (SSE)
// ============================================

router.get('/api/fcm/stream', ensureAuthenticated, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    
    const user = db.getUser(req.user.id);
    const authToken = req.query.token || (user ? user.auth_token : null);

    if (!authToken) {
        send({ step: 'init', msg: 'Falta Token de Facepunch', status: 'error' });
        return res.end();
    }

    global.fcmManager.debugRegisterDevice(req.user.id, authToken, (step, msg, status) => {
        send({ step, msg, status });
        if (step === 'final') {
             setTimeout(() => res.end(), 1000);
        }
    });

    req.on('close', () => {});
});

// ============================================
// RUTAS FRONTEND
// ============================================

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Sirve la nueva versión moderna del dashboard
router.get('/panel', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/panel.html'));
});

module.exports = router;
