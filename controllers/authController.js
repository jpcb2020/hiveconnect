const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const logger = require('../utils/logger');



// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Verificar se o usuário existe no banco de dados
        let userResult = await pool.query('SELECT * FROM conexbot.users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Credenciais inválidas' });
        }

        const user = userResult.rows[0];

        // Comparar a senha fornecida com a senha hasheada no banco
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciais inválidas' });
        }

        // Criar payload do JWT
        // Incluindo email para permitir acesso direto às funcionalidades do usuário
        const payload = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email, // Email adicionado para funcionalidades WhatsApp e melhor rastreabilidade
                role: user.role
            }
        };

        // Assinar o token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' }, // Token expira em 5 horas
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        logger.error('Erro no login de usuário:', err.message);
        res.status(500).send('Erro no servidor');
    }
};
