// config/db.js
const { Pool } = require('pg');
const dbConfig = require('./database');
const logger = require('../utils/logger');

const pool = new Pool({
  ...dbConfig,
  // Configurações de pool otimizadas
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite para conexões inativas
  connectionTimeoutMillis: 2000, // tempo limite para estabelecer conexão
});

// Teste da conexão com logging otimizado
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Erro ao conectar ao PostgreSQL:', err.stack);
  } else {
    logger.database('Conectado ao PostgreSQL com sucesso em:', res.rows[0].now);
  }
});

// Eventos do pool para monitoramento
pool.on('error', (err) => {
  logger.error('Erro inesperado no pool de conexões:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  // Método para transações
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
  // Método para fechar o pool (útil para testes)
  end: () => pool.end()
};
