// config/database.js

// É altamente recomendável usar variáveis de ambiente para dados sensíveis,
// especialmente em produção. Ex: process.env.DB_USER, process.env.DB_PASSWORD

// As variáveis de ambiente já são carregadas no server.js 

const dbConfig = {
  user: process.env.DB_USER || 'postgres', 
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'managerbet_db', 
  password: process.env.DB_PASSWORD || 'your_password', 
  port: parseInt(process.env.DB_PORT) || 5432, 
};

module.exports = dbConfig;
