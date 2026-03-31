/*
    [MÓDULO 5] - Enrutador Web y Endpoints
*/

const express = require('express');
const router = express.Router();

// Middleware para verificar si el usuario está loqueado
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'No autorizado. Por favor inicia sesión mediante Steam (/auth/steam).' });
}

// ============================================
// RUTAS DE AUTENTICACIÓN (STEAM)
// ============================================

// El middleware passport se carga solo si la app en server.js lo inicializa.
router.get('/auth/steam', (req, res, next) => {
    const passport = require('passport');
    passport.authenticate('steam', { failureRedirect: '/' })(req, res, next);
});

router.get('/auth/steam/return', (req, res, next) => {
    const passport = require('passport');
    passport.authenticate('steam', { failureRedirect: '/' })(req, res, () => {
        // Éxito en el login, redirigir al panel
        res.redirect('/api/me');
    });
});

router.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        res.redirect('/');
    });
});

// ============================================
// RUTAS DE LA API / PANEL
// ============================================

// Endpoint genérico para ver información de la sesión
router.get('/api/me', ensureAuthenticated, (req, res) => {
    res.json({
        message: 'Sesión iniciada correctamente',
        user: {
            steamId: req.user.id,
            displayName: req.user.displayName,
            avatar: (req.user.photos && req.user.photos.length > 2) ? req.user.photos[2].value : null
        }
    });
});

// Endpoint esqueleto para obtener/guardar configuraciones
router.get('/api/config', ensureAuthenticated, (req, res) => {
    /* 
       Aquí se debería integrar la lectura de archivos de credenciales ubicados en:
       `/credentials/[guildId].json` o buscar en una base de datos propia.
    */
    res.json({ 
        message: 'Aquí enviaremos el JSON con la configuración del bot para este Steam ID.',
        status: 'ok',
        userId: req.user.id
    });
});

// Ruta base
router.get('/', (req, res) => {
    res.send(`
        <h1>RustPlusPlus Dashboard</h1>
        <p><a href="/auth/steam">Iniciar Sesión con Steam</a></p>
    `);
});

module.exports = router;
