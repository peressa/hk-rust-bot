const Fs = require('fs');
const Path = require('path');

let enMessages = {};
try {
    const enPath = Path.join(__dirname, '..', 'languages', 'en.json');
    if (Fs.existsSync(enPath)) {
        enMessages = JSON.parse(Fs.readFileSync(enPath, 'utf8'));
    }
} catch (e) {
    console.error('[intlHelper] Error loading en.json:', e);
}

/**
 * Función de traducción universal de respaldo.
 * @param {string} id - El ID del mensaje (ej: 'errorCap')
 * @param {object} variables - Variables para el mensaje (ej: { name: 'Player' })
 * @returns {string} - El mensaje traducido o el ID original si falla.
 */
function get(id, variables = {}) {
    let message = enMessages[id] || id;
    
    // Reemplazo simple de variables {variable}
    if (variables && Object.keys(variables).length > 0) {
        for (const [key, value] of Object.entries(variables)) {
            message = message.replace(new RegExp(`{${key}}`, 'g'), value);
        }
    }
    
    return message;
}

module.exports = { get };
