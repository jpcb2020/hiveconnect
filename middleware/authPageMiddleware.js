const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger rotas de páginas HTML (views)
 * Redireciona para o login se o usuário não estiver autenticado
 */
module.exports = function(req, res, next) {
    // Verificar se existe cookie de autenticação
    const token = req.cookies && req.cookies.jwtToken;
    
    if (!token) {
        // Se não houver token, redirecionar para a página de login
        return res.redirect('/login');
    }
    
    // Verificar token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Adiciona o payload do usuário ao objeto req
        next(); // Continuar para renderizar a página protegida
    } catch (err) {
        console.error('Erro na verificação do token de página:', err.message);
        // Se token for inválido ou expirado, redirecionar para login
        res.redirect('/login');
    }
};
