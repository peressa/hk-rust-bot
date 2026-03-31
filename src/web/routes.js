const express = require('express');
const router = express.Router();
const db = require('../structures/database');
const passport = require('passport');

// Middleware para verificar si el usuario está logueado
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'No autorizado. Por favor inicia sesión mediante Steam (/auth/steam).' });
}

// ============================================
// RUTAS DE AUTENTICACIÓN (STEAM)
// ============================================

router.get('/auth/steam', (req, res, next) => {
    passport.authenticate('steam', { failureRedirect: '/' })(req, res, next);
});

router.get('/auth/steam/return', (req, res, next) => {
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
// RUTAS DE LA API / PANEL (MULTI-TENANT)
// ============================================

// Ver mi información y estado del bot
router.get('/api/me', ensureAuthenticated, (req, res) => {
    const tenant = db.getTenant(req.user.id);
    res.json({
        user: {
            steamId: req.user.id,
            displayName: req.user.displayName,
            avatar: (req.user.photos && req.user.photos.length > 2) ? req.user.photos[2].value : null
        },
        bot: {
            status: tenant ? tenant.bot_status : 0,
            hasToken: !!(tenant && tenant.discord_token),
            rustConfig: tenant ? {
                ip: tenant.rust_ip,
                port: tenant.rust_port,
                steamId: tenant.rust_steam_id,
                hasToken: !!tenant.rust_token
            } : null
        }
    });
});

// Guardar/Actualizar Token de Discord
router.post('/api/bot/token', ensureAuthenticated, (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    db.upsertTenant(req.user.id, req.user.displayName, token);
    res.json({ message: 'Token guardado exitosamente' });
});

// Guardar/Actualizar Configuración de Rust+
router.post('/api/bot/rust-config', ensureAuthenticated, (req, res) => {
    const { ip, port, steamId, token } = req.body;
    if (!ip || !port || !steamId || !token) {
        return res.status(400).json({ error: 'Todos los campos de Rust+ son requeridos (IP, Puerto, SteamID, Token)' });
    }

    db.updateRustConfig(req.user.id, { ip, port, steamId, token });
    res.json({ message: 'Configuración de Rust+ guardada exitosamente' });
});

// Iniciar Bot dinámicamente
router.post('/api/bot/start', ensureAuthenticated, async (req, res) => {
    const tenant = db.getTenant(req.user.id);
    if (!tenant || !tenant.discord_token) {
        return res.status(400).json({ error: 'Primero debes guardar un token de Discord' });
    }

    try {
        await req.botManager.startBot(req.user.id, tenant.discord_token);
        res.json({ message: 'Bot iniciado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar el bot', details: error.message });
    }
});

// Detener Bot dinámicamente
router.post('/api/bot/stop', ensureAuthenticated, async (req, res) => {
    try {
        await req.botManager.stopBot(req.user.id);
        res.json({ message: 'Bot detenido' });
    } catch (error) {
        res.status(500).json({ error: 'Error al detener el bot' });
    }
});

// Ruta base / Landing
router.get('/', (req, res) => {
    res.send(`
        <h1>RustPlusPlus Multi-Tenant Dashboard</h1>
        <p><a href="/auth/steam">Iniciar Sesión con Steam</a></p>
    `);
});

// Panel Simple (Placeholder HTML)
router.get('/panel', ensureAuthenticated, (req, res) => {
    res.send(`
        <h1>Panel de Control Multi-Tenant</h1>
        <div id="status">Cargando estado...</div>
        <hr>
        <h3>Configuración Discord</h3>
        <input type="text" id="token" placeholder="Discord Bot Token">
        <button onclick="saveToken()">Guardar Token Discord</button>
        
        <hr>
        <h3>Configuración Rust+</h3>
        <input type="text" id="rust_ip" placeholder="Server IP">
        <input type="text" id="rust_port" placeholder="App Port (5678)">
        <input type="text" id="rust_steamid" placeholder="Tu Steam ID 64">
        <input type="text" id="rust_token" placeholder="Player Token">
        <button onclick="saveRust()">Guardar Config Rust+</button>
        
        <hr>
        <button onclick="startBot()">Iniciar Bot (Discord + Rust)</button>
        <button onclick="stopBot()">Detener Bot</button>
        <br><br>
        <a href="/auth/logout">Cerrar Sesión</a>

        <script>
            async function refresh() {
                const res = await fetch('/api/me');
                const data = await res.json();
                document.getElementById('status').innerText = 'Bot: ' + (data.bot.status ? 'ONLINE 🟢' : 'OFFLINE 🔴');
                
                if(data.bot.rustConfig) {
                    document.getElementById('rust_ip').value = data.bot.rustConfig.ip || '';
                    document.getElementById('rust_port').value = data.bot.rustConfig.port || '';
                    document.getElementById('rust_steamid').value = data.bot.rustConfig.steamId || '';
                }
            }
            async function saveToken() {
                const token = document.getElementById('token').value;
                const res = await fetch('/api/bot/token', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({token})
                });
                const data = await res.json();
                alert(data.message || data.error);
            }
            async function saveRust() {
                const config = {
                    ip: document.getElementById('rust_ip').value,
                    port: document.getElementById('rust_port').value,
                    steamId: document.getElementById('rust_steamid').value,
                    token: document.getElementById('rust_token').value
                };
                const res = await fetch('/api/bot/rust-config', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(config)
                });
                const data = await res.json();
                alert(data.message || data.error);
            }
            async function startBot() {
                const res = await fetch('/api/bot/start', {method: 'POST'});
                const data = await res.json();
                if(data.error) alert(data.error);
                refresh();
            }
            async function stopBot() {
                await fetch('/api/bot/stop', {method: 'POST'});
                refresh();
            }
            refresh();
        </script>
    `);
});

module.exports = router;
