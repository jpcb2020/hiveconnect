const jwt = require('jsonwebtoken');

/**
 * Middleware para redirecionar usuários já autenticados
 * Usado em páginas como login e registro
 */
module.exports = function(req, res, next) {
    // Se já tiver um cookie de token, redireciona baseado no role
    if (req.cookies && req.cookies.jwtToken) {
        try {
            const decoded = jwt.verify(req.cookies.jwtToken, process.env.JWT_SECRET);
            // Redirecionar baseado no role do usuário
            if (decoded.user && decoded.user.role === 'admin') {
                return res.redirect('/admin');
            } else {
                return res.redirect('/dashboard');
            }
        } catch (err) {
            // Se o token for inválido, limpa o cookie e continua
            res.clearCookie('jwtToken');
        }
    }
    next();
}; 