const { getWhatsAppInstanceStatus, getWhatsAppQRCode, logoutWhatsAppInstance, createWhatsAppInstance, deleteWhatsAppInstance } = require('../utils/whatsappAPI');
const logger = require('../utils/logger');

// @route   GET api/profile/me
// @desc    Get current user's profile (mock)
// @access  Private
exports.getCurrentUserProfile = async (req, res) => {
    try {
        // req.user é adicionado pelo authMiddleware
        // Em um cenário real, você buscaria o perfil do usuário no banco de dados usando req.user.id
        res.json({
            msg: 'Dados do perfil acessados com sucesso!',
            user: req.user // Contém o payload do JWT (id, name, email, etc.)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   GET api/profile/whatsapp/status
// @desc    Get current user's WhatsApp instance status
// @access  Private
exports.getMyWhatsAppStatus = async (req, res) => {
    try {
        // Usar o email do usuário logado do JWT
        const userEmail = req.user.email;
        
        if (!userEmail) {
            return res.status(400).json({ msg: 'Email do usuário não encontrado no token' });
        }
        
        const whatsappResult = await getWhatsAppInstanceStatus(userEmail);
        
        if (whatsappResult.success) {
            res.json({
                msg: 'Status da sua instância WhatsApp obtido com sucesso',
                userEmail: userEmail,
                clientId: whatsappResult.clientId,
                status: whatsappResult.status
            });
        } else {
            res.status(404).json({
                msg: 'Sua instância WhatsApp não foi encontrada ou há erro na verificação',
                error: whatsappResult.error
            });
        }
    } catch (err) {
        logger.error(`Erro ao verificar status WhatsApp para usuário ${req.user.email}:`, err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   GET api/profile/whatsapp/qr
// @desc    Get current user's WhatsApp QR Code
// @access  Private
exports.getMyWhatsAppQR = async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        if (!userEmail) {
            return res.status(400).json({ msg: 'Email do usuário não encontrado no token' });
        }
        
        const whatsappResult = await getWhatsAppQRCode(userEmail);
        
        if (whatsappResult.success) {
            res.json({
                success: true,
                qrCode: whatsappResult.qrCode,
                status: whatsappResult.status,
                clientId: whatsappResult.clientId
            });
        } else {
            res.status(404).json({
                success: false,
                msg: 'QR Code não disponível ou erro na verificação',
                error: whatsappResult.error
            });
        }
    } catch (err) {
        logger.error(`Erro ao obter QR Code WhatsApp para usuário ${req.user.email}:`, err.message);
        res.status(500).json({
            success: false,
            msg: 'Erro no servidor'
        });
    }
};

// @route   POST api/profile/whatsapp/logout
// @desc    Logout current user's WhatsApp
// @access  Private
exports.logoutMyWhatsApp = async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        if (!userEmail) {
            return res.status(400).json({ msg: 'Email do usuário não encontrado no token' });
        }
        
        const whatsappResult = await logoutWhatsAppInstance(userEmail);
        
        if (whatsappResult.success) {
            res.json({
                success: true,
                msg: 'Logout do WhatsApp realizado com sucesso',
                result: whatsappResult.result
            });
        } else {
            res.status(400).json({
                success: false,
                msg: 'Erro ao fazer logout do WhatsApp',
                error: whatsappResult.error
            });
        }
    } catch (err) {
        logger.error(`Erro ao fazer logout WhatsApp para usuário ${req.user.email}:`, err.message);
        res.status(500).json({
            success: false,
            msg: 'Erro no servidor'
        });
    }
};

// @route   POST api/profile/whatsapp/create-instance
// @desc    Create current user's WhatsApp instance
// @access  Private
exports.createMyWhatsAppInstance = async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        if (!userEmail) {
            return res.status(400).json({ msg: 'Email do usuário não encontrado no token' });
        }
        
        // Primeiro, tentar deletar instância existente (se houver)
        try {
            logger.info(`Tentando deletar instância existente para ${userEmail} antes de criar nova...`);
            await deleteWhatsAppInstance(userEmail);
        } catch (deleteError) {
            logger.info(`Nenhuma instância existente encontrada para ${userEmail} ou erro ao deletar (normal em primeira criação)`);
        }
        
        const options = {
            ignoreGroups: true,
            ...req.body.options
        };
        
        const whatsappResult = await createWhatsAppInstance(userEmail, options);
        
        if (whatsappResult.success) {
            logger.info(`Instância WhatsApp criada com sucesso para usuário ${userEmail}: ${whatsappResult.clientId}`);
            
            res.status(201).json({
                success: true,
                msg: 'Instância WhatsApp criada com sucesso',
                userEmail: userEmail,
                clientId: whatsappResult.clientId,
                qrCodeUrl: whatsappResult.qrCodeUrl,
                status: 'Instância criada - escaneie o QR Code'
            });
        } else {
            res.status(500).json({
                success: false,
                msg: 'Erro ao criar instância WhatsApp',
                error: whatsappResult.error
            });
        }
    } catch (err) {
        logger.error(`Erro ao criar instância WhatsApp para usuário ${req.user.email}:`, err.message);
        res.status(500).json({
            success: false,
            msg: 'Erro no servidor'
        });
    }
};
