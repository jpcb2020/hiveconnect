/**
 * Sistema de logging centralizado
 * Permite controlar logs baseado no ambiente
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

class Logger {
    constructor() {
        // Define o nível de log baseado no ambiente
        this.level = process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    }

    error(message, ...args) {
        if (this.level >= LOG_LEVELS.ERROR) {
            console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }

    warn(message, ...args) {
        if (this.level >= LOG_LEVELS.WARN) {
            console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }

    info(message, ...args) {
        if (this.level >= LOG_LEVELS.INFO) {
            console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }

    debug(message, ...args) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }

    // Método específico para logs de banco de dados
    database(message, ...args) {
        this.info(`[DATABASE] ${message}`, ...args);
    }

    // Método específico para logs de autenticação
    auth(message, ...args) {
        this.info(`[AUTH] ${message}`, ...args);
    }
}

module.exports = new Logger(); 