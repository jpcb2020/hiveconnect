const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Obter token do header
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

    // Verificar token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Adiciona o payload do usuário ao objeto req
        next(); // Passa para o próximo middleware ou rota
    } catch (err) {
        console.error('Erro na verificação do token:', err.message);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Token inválido, autorização negada' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expirado, autorização negada' });
        }
        res.status(500).json({ msg: 'Erro no servidor ao validar token' });
    }
};
