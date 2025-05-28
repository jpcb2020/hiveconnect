const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');



// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Por favor, inclua um email válido').isEmail(),
        check('password', 'Senha é obrigatória').exists()
    ],
    authController.loginUser
);

module.exports = router;
