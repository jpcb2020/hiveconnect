const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Middleware interno para verificar autenticação (reutilizável dentro deste arquivo)
const adminAuthMiddleware = (req, res, next) => {
    // Obter token do header Authorization
    const authHeader = req.header('Authorization');

    // Verificar se não há token
    if (!authHeader) {
        return res.status(401).json({ msg: 'Nenhum token, autorização negada' });
    }

    // O token geralmente vem como "Bearer <token>"
    const tokenParts = authHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ msg: 'Token mal formatado, autorização negada' });
    }

    const token = tokenParts[1];

    try {
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        logger.error('Token inválido:', err.message);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Token inválido, autorização negada' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expirado, autorização negada' });
        }
        res.status(500).json({ msg: 'Erro no servidor ao validar token' });
    }
};

// Middleware para verificar se o usuário é admin
const adminAuth = (req, res, next) => {
    // Primeiro verifica se está autenticado
    adminAuthMiddleware(req, res, () => {
        // Depois verifica se é admin
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ 
                msg: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
            });
        }
    });
};

// Middleware para verificar se o usuário é admin ou moderator
const moderatorAuth = (req, res, next) => {
    adminAuthMiddleware(req, res, () => {
        if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
            next();
        } else {
            return res.status(403).json({ 
                msg: 'Acesso negado. Permissões insuficientes.' 
            });
        }
    });
};

module.exports = {
    adminAuth,
    moderatorAuth
}; 