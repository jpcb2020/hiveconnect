const pool = require('../config/db');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { 
    createWhatsAppInstance, 
    deleteWhatsAppInstance, 
    getWhatsAppInstanceStatus, 
    listAllWhatsAppInstances 
} = require('../utils/whatsappAPI');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
exports.getDashboard = async (req, res) => {
    try {
        // Estatísticas básicas do sistema
        const usersCount = await pool.query('SELECT COUNT(*) as total FROM conexbot.users');
        const adminsCount = await pool.query('SELECT COUNT(*) as total FROM conexbot.users WHERE role = $1', ['admin']);
        const regularUsersCount = await pool.query('SELECT COUNT(*) as total FROM conexbot.users WHERE role = $1', ['user']);

        const stats = {
            totalUsers: parseInt(usersCount.rows[0].total),
            adminUsers: parseInt(adminsCount.rows[0].total),
            regularUsers: parseInt(regularUsersCount.rows[0].total),
            currentAdmin: req.user.name
        };

        res.json({
            msg: 'Dashboard carregado com sucesso',
            stats: stats,
            currentAdmin: `${req.user.name} (${req.user.email})`
        });
    } catch (err) {
        logger.error('Erro ao carregar dashboard admin:', err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   GET /api/admin/users
// @desc    Get all users (admin view)
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, created_at, updated_at FROM conexbot.users ORDER BY created_at DESC'
        );

        res.json({
            msg: 'Lista de usuários carregada com sucesso',
            users: result.rows
        });
    } catch (err) {
        logger.error('Erro ao buscar usuários:', err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   PUT /api/admin/users/:id
// @desc    Update user (name, email, role, and optionally password)
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;

        // Validações básicas
        if (!name || !email || !role) {
            return res.status(400).json({ msg: 'Nome, email e role são obrigatórios' });
        }

        // Validar role
        const validRoles = ['admin', 'user', 'moderator'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ msg: 'Role inválido' });
        }

        // Não permitir que o admin remova o próprio role de admin
        if (parseInt(id) === req.user.id && role !== 'admin') {
            return res.status(400).json({ msg: 'Você não pode remover seu próprio acesso de administrador' });
        }

        // Verificar se o email já existe em outro usuário
        const existingUser = await pool.query(
            'SELECT id FROM conexbot.users WHERE email = $1 AND id != $2', 
            [email, id]
        );
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ msg: 'Este email já está sendo usado por outro usuário' });
        }

        let result;
        
        if (password && password.trim()) {
            // Validar comprimento mínimo da senha
            if (password.trim().length < 6) {
                return res.status(400).json({ msg: 'A senha deve ter pelo menos 6 caracteres' });
            }
            
            // Se senha foi fornecida, fazer hash e atualizar com senha
            const hashedPassword = await bcrypt.hash(password.trim(), 10);
            result = await pool.query(
                'UPDATE conexbot.users SET name = $1, email = $2, role = $3, password = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, name, email, role, updated_at',
                [name, email, role, hashedPassword, id]
            );
            logger.info(`Admin ${req.user.name} (${req.user.email}) atualizou usuário ID ${id} (incluindo senha): ${name} (${email})`);
        } else {
            // Se senha não foi fornecida, atualizar sem senha
            result = await pool.query(
                'UPDATE conexbot.users SET name = $1, email = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, name, email, role, updated_at',
                [name, email, role, id]
            );
            logger.info(`Admin ${req.user.name} (${req.user.email}) atualizou usuário ID ${id}: ${name} (${email})`);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        res.json({
            msg: 'Usuário atualizado com sucesso',
            user: result.rows[0]
        });
    } catch (err) {
        logger.error('Erro ao atualizar usuário:', err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Não permitir que o admin delete a própria conta
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ msg: 'Você não pode deletar sua própria conta' });
        }

        const result = await pool.query(
            'DELETE FROM conexbot.users WHERE id = $1 RETURNING id, name, email',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        const deletedUser = result.rows[0];

        // Tentar excluir a instância do WhatsApp do usuário deletado
        try {
            logger.info(`Deletando instância WhatsApp do usuário removido: ${deletedUser.email}`);
            const whatsappResult = await deleteWhatsAppInstance(deletedUser.email);
            
            if (whatsappResult.success) {
                logger.info(`Instância WhatsApp deletada com sucesso para ${deletedUser.email}`);
            } else {
                logger.warn(`Falha ao deletar instância WhatsApp para ${deletedUser.email}: ${whatsappResult.error}`);
            }
        } catch (whatsappError) {
            logger.error(`Erro inesperado ao deletar instância WhatsApp para ${deletedUser.email}:`, whatsappError.message);
        }

        logger.info(`Admin ${req.user.name} (${req.user.email}) deletou usuário: ${deletedUser.name} (${deletedUser.email})`);
        res.json({
            msg: 'Usuário deletado com sucesso',
            deletedUser: deletedUser
        });
    } catch (err) {
        logger.error('Erro ao deletar usuário:', err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   POST /api/admin/users
// @desc    Create new user (admin only)
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role = 'user' } = req.body;

        // Validações básicas
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Nome, email e senha são obrigatórios' });
        }

        // Validar comprimento mínimo da senha
        if (password.length < 6) {
            return res.status(400).json({ msg: 'A senha deve ter pelo menos 6 caracteres' });
        }

        // Verificar se usuário já existe
        const existingUser = await pool.query('SELECT id FROM conexbot.users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ msg: 'Usuário com este email já existe' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar usuário
        const result = await pool.query(
            'INSERT INTO conexbot.users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
            [name, email, hashedPassword, role]
        );

        const newUser = result.rows[0];

        // Criar instância do WhatsApp para o novo usuário
        logger.info(`Criando instância WhatsApp para o novo usuário: ${newUser.email}`);
        
        try {
            const whatsappResult = await createWhatsAppInstance(newUser.email, {
                ignoreGroups: true, // Por padrão, ignorar grupos
                // Você pode adicionar webhook aqui se necessário
                // webhookUrl: `https://seu-dominio.com/webhook/${newUser.id}`
            });

            if (whatsappResult.success) {
                logger.info(`Admin ${req.user.name} (${req.user.email}) criou instância WhatsApp para ${newUser.email}: ${whatsappResult.clientId}`);
                
                // Retornar dados do usuário + informações da instância WhatsApp
                res.status(201).json({
                    msg: 'Usuário criado com sucesso e instância WhatsApp configurada',
                    user: newUser,
                    whatsapp: {
                        clientId: whatsappResult.clientId,
                        qrCodeUrl: whatsappResult.qrCodeUrl,
                        status: 'Aguardando conexão - escaneie o QR Code'
                    }
                });
            } else {
                logger.warn(`Falha ao criar instância WhatsApp para ${newUser.email}: ${whatsappResult.error}`);
                
                // Usuário foi criado, mas WhatsApp falhou - ainda retornar sucesso
                res.status(201).json({
                    msg: 'Usuário criado com sucesso, mas houve problema ao configurar WhatsApp',
                    user: newUser,
                    whatsapp: {
                        error: whatsappResult.error,
                        status: 'Erro na configuração - contate o administrador'
                    }
                });
            }
        } catch (whatsappError) {
            logger.error(`Erro inesperado ao criar instância WhatsApp para ${newUser.email}:`, whatsappError.message);
            
            // Usuário foi criado, mas WhatsApp falhou - ainda retornar sucesso
        res.status(201).json({
                msg: 'Usuário criado com sucesso, mas houve problema ao configurar WhatsApp',
                user: newUser,
                whatsapp: {
                    error: 'Erro inesperado na configuração do WhatsApp',
                    status: 'Erro na configuração - contate o administrador'
                }
            });
        }

        logger.info(`Admin ${req.user.name} (${req.user.email}) criou novo usuário: ${newUser.name} (${newUser.email})`);

    } catch (err) {
        logger.error('Erro ao criar usuário:', err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validar role
        const validRoles = ['admin', 'user', 'moderator'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ msg: 'Role inválido' });
        }

        // Não permitir que o admin remova o próprio role de admin
        if (parseInt(id) === req.user.id && role !== 'admin') {
            return res.status(400).json({ msg: 'Você não pode remover seu próprio acesso de administrador' });
        }

        const result = await pool.query(
            'UPDATE conexbot.users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        logger.info(`Admin ${req.user.name} (${req.user.email}) alterou role do usuário ID ${id} para ${role}`);
        res.json({
            msg: 'Role do usuário atualizado com sucesso',
            user: result.rows[0]
        });
    } catch (err) {
        logger.error('Erro ao atualizar role do usuário:', err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   GET /api/admin/whatsapp/instances
// @desc    List all WhatsApp instances
// @access  Private (Admin only)
exports.getWhatsAppInstances = async (req, res) => {
    try {
        const whatsappResult = await listAllWhatsAppInstances();
        
        if (whatsappResult.success) {
            res.json({
                msg: 'Instâncias WhatsApp listadas com sucesso',
                instances: whatsappResult.instances
            });
        } else {
            res.status(500).json({
                msg: 'Erro ao listar instâncias WhatsApp',
                error: whatsappResult.error
            });
        }
    } catch (err) {
        logger.error('Erro ao listar instâncias WhatsApp:', err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   GET /api/admin/whatsapp/status/:email
// @desc    Get WhatsApp instance status for a user
// @access  Private (Admin only)
exports.getWhatsAppStatus = async (req, res) => {
    try {
        const { email } = req.params;
        
        const whatsappResult = await getWhatsAppInstanceStatus(email);
        
        if (whatsappResult.success) {
            res.json({
                msg: 'Status da instância WhatsApp obtido com sucesso',
                userEmail: email,
                clientId: whatsappResult.clientId,
                status: whatsappResult.status
            });
        } else {
            res.status(404).json({
                msg: 'Instância WhatsApp não encontrada ou erro ao verificar status',
                error: whatsappResult.error
            });
        }
    } catch (err) {
        logger.error('Erro ao verificar status WhatsApp:', err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   POST /api/admin/whatsapp/create-instance
// @desc    Manually create WhatsApp instance for existing user
// @access  Private (Admin only)
exports.createWhatsAppInstanceForUser = async (req, res) => {
    try {
        const { email, options = {} } = req.body;
        
        if (!email) {
            return res.status(400).json({ msg: 'Email do usuário é obrigatório' });
        }

        // Verificar se o usuário existe
        const userExists = await pool.query('SELECT id, name FROM conexbot.users WHERE email = $1', [email]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        const whatsappResult = await createWhatsAppInstance(email, {
            ignoreGroups: true,
            ...options
        });

        if (whatsappResult.success) {
            logger.info(`Admin ${req.user.name} (${req.user.email}) criou instância WhatsApp para ${email}: ${whatsappResult.clientId}`);
            
            res.status(201).json({
                msg: 'Instância WhatsApp criada com sucesso',
                userEmail: email,
                clientId: whatsappResult.clientId,
                qrCodeUrl: whatsappResult.qrCodeUrl
            });
        } else {
            res.status(500).json({
                msg: 'Erro ao criar instância WhatsApp',
                error: whatsappResult.error
            });
        }
    } catch (err) {
        logger.error('Erro ao criar instância WhatsApp:', err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   DELETE /api/admin/whatsapp/delete-instance
// @desc    Manually delete WhatsApp instance for a user
// @access  Private (Admin only)
exports.deleteWhatsAppInstanceForUser = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ msg: 'Email do usuário é obrigatório' });
        }

        const whatsappResult = await deleteWhatsAppInstance(email);

        if (whatsappResult.success) {
            logger.info(`Admin ${req.user.name} (${req.user.email}) deletou instância WhatsApp para ${email}`);
            
            res.json({
                msg: 'Instância WhatsApp deletada com sucesso',
                userEmail: email
            });
        } else {
            res.status(500).json({
                msg: 'Erro ao deletar instância WhatsApp',
                error: whatsappResult.error
            });
        }
    } catch (err) {
        logger.error('Erro ao deletar instância WhatsApp:', err.message);
        res.status(500).send('Erro no servidor');
    }
}; 