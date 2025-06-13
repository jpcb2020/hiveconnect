const { getWhatsAppInstanceStatus, getWhatsAppQRCode, logoutWhatsAppInstance, createWhatsAppInstance, deleteWhatsAppInstance } = require('../utils/whatsappAPI');
const logger = require('../utils/logger');
const pool = require('../config/db');
const FormData = require('form-data');

// Importação dinâmica do node-fetch para compatibilidade
let fetch;
(async () => {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
})();

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

// @route   GET api/profile/message
// @desc    Get current user's saved message
// @access  Private
exports.getUserMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Buscar a mensagem do usuário no banco de dados
        const result = await pool.query(
            'SELECT mensagem FROM conexbot.users WHERE id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }
        
        res.json({
            success: true,
            mensagem: result.rows[0].mensagem || ''
        });
    } catch (err) {
        logger.error(`Erro ao recuperar mensagem do usuário ${req.user.email}:`, err.message);
        res.status(500).json({
            success: false,
            msg: 'Erro no servidor'
        });
    }
};

// @route   POST api/profile/upload-media
// @desc    Upload media file to Hive Storage
// @access  Private
exports.uploadMedia = async (req, res) => {
    try {
        logger.info(`Iniciando upload de mídia para usuário: ${req.user?.email}`);
        
        // Verificar se o arquivo foi enviado
        if (!req.file) {
            logger.error('Nenhum arquivo foi enviado na requisição');
            return res.status(400).json({
                success: false,
                msg: 'Nenhum arquivo foi enviado'
            });
        }

        const file = req.file;
        const userEmail = req.user.email; // Email do usuário do JWT
        
        logger.info(`Arquivo recebido: ${file.originalname}, tamanho: ${file.size}, tipo: ${file.mimetype}`);
        logger.info(`Configurações de upload - URL: ${process.env.MEDIA_STORAGE_API_URL}, API Key configurada: ${!!process.env.MEDIA_STORAGE_API_KEY}`);
        
        // Criar FormData para envio ao Hive Storage
        const formData = new FormData();
        formData.append('mediaFile', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
        formData.append('username', userEmail);
        
        // Se houver displayName no body, adicionar
        if (req.body.displayName) {
            formData.append('displayName', req.body.displayName);
        }

        logger.info('FormData criado, iniciando requisição para Hive Storage...');

        // Fazer upload para o Hive Storage
        const uploadResponse = await fetch(`${process.env.MEDIA_STORAGE_API_URL}/api/media`, {
            method: 'POST',
            headers: {
                'x-api-key': process.env.MEDIA_STORAGE_API_KEY,
                ...formData.getHeaders()
            },
            body: formData
        });

        logger.info(`Resposta do Hive Storage: ${uploadResponse.status} ${uploadResponse.statusText}`);

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.text();
            logger.error(`Erro no upload para Hive Storage: ${uploadResponse.status} - ${errorData}`);
            return res.status(500).json({
                success: false,
                msg: 'Erro ao fazer upload do arquivo',
                error: errorData
            });
        }

        const uploadResult = await uploadResponse.json();
        
        logger.info(`Upload realizado com sucesso para usuário ${userEmail}: ${file.originalname}`);
        logger.info(`Resultado do upload:`, uploadResult);
        
        // Buscar o ID do usuário pelo email
        const userQuery = 'SELECT id FROM conexbot.users WHERE email = $1';
        const userResult = await pool.query(userQuery, [userEmail]);
        
        if (userResult.rows.length === 0) {
            logger.error(`Usuário não encontrado: ${userEmail}`);
            return res.status(404).json({
                success: false,
                msg: 'Usuário não encontrado'
            });
        }
        
        const userId = userResult.rows[0].id;
        
        // Salvar informações da mídia no banco de dados
        const insertMediaQuery = `
            INSERT INTO conexbot.media (user_id, filename, original_name, url, mimetype, size, uploaded_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id, uploaded_at
        `;
        
        // Construir URL completa concatenando MEDIA_STORAGE_API_URL com a URL relativa
        const relativeUrl = uploadResult.data?.url || uploadResult.url;
        const fullUrl = `${process.env.MEDIA_STORAGE_API_URL}${relativeUrl}`;
        
        const mediaValues = [
            userId,
            uploadResult.data?.filename || uploadResult.filename || file.originalname,
            uploadResult.data?.originalName || file.originalname,
            fullUrl,
            file.mimetype,
            file.size
        ];
        
        const mediaResult = await pool.query(insertMediaQuery, mediaValues);
        const savedMedia = mediaResult.rows[0];
        
        logger.info(`Mídia salva no banco de dados com ID: ${savedMedia.id}`);
        
        res.json({
            success: true,
            msg: 'Arquivo enviado com sucesso',
            data: {
                id: savedMedia.id,
                url: fullUrl,
                filename: uploadResult.data?.filename || uploadResult.filename || file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                originalName: uploadResult.data?.originalName || file.originalname,
                uploadedAt: savedMedia.uploaded_at,
                hiveStorageData: uploadResult.data || uploadResult
            }
        });
        
    } catch (err) {
        logger.error(`Erro ao fazer upload de mídia para usuário ${req.user?.email}:`, err.message);
        logger.error('Stack trace:', err.stack);
        res.status(500).json({
            success: false,
            msg: 'Erro no servidor ao fazer upload'
        });
    }
};

// @route   GET api/profile/ia-status
// @desc    Get user's IA status
// @access  Private
exports.getIAStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = 'SELECT ia FROM conexbot.users WHERE id = $1';
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }
        
        const iaStatus = result.rows[0].ia || false;
        
        res.json({
            ia: iaStatus
        });
        
    } catch (err) {
        logger.error(`Erro ao buscar status IA para usuário ${req.user.id}:`, err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   GET api/profile/media
// @desc    Get user's media files
// @access  Private
exports.getUserMedia = async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        // Buscar o ID do usuário pelo email
        const userQuery = 'SELECT id FROM conexbot.users WHERE email = $1';
        const userResult = await pool.query(userQuery, [userEmail]);
        
        if (userResult.rows.length === 0) {
            logger.error(`Usuário não encontrado: ${userEmail}`);
            return res.status(404).json({
                success: false,
                msg: 'Usuário não encontrado'
            });
        }
        
        const userId = userResult.rows[0].id;
        
        // Buscar todas as mídias do usuário
        const mediaQuery = `
            SELECT id, filename, original_name, url, mimetype, size, uploaded_at
            FROM conexbot.media
            WHERE user_id = $1
            ORDER BY uploaded_at DESC
        `;
        
        const mediaResult = await pool.query(mediaQuery, [userId]);
        
        res.json({
            success: true,
            count: mediaResult.rows.length,
            data: mediaResult.rows
        });
        
    } catch (err) {
        logger.error(`Erro ao buscar mídias para usuário ${req.user?.email}:`, err.message);
        logger.error('Stack trace:', err.stack);
        res.status(500).json({
            success: false,
            msg: 'Erro no servidor ao buscar mídias'
        });
    }
};

// @route   DELETE api/profile/media/:id
// @desc    Delete media file from Hive Storage and database
// @access  Private
exports.deleteMedia = async (req, res) => {
    try {
        const mediaId = req.params.id;
        const userEmail = req.user.email;
        
        logger.info(`Tentativa de exclusão de mídia ID: ${mediaId} por usuário: ${userEmail}`);
        
        // Buscar informações da mídia no banco de dados
        const findMediaQuery = `
            SELECT m.id, m.filename, u.id as user_id
            FROM conexbot.media m
            JOIN conexbot.users u ON m.user_id = u.id
            WHERE m.id = $1 AND u.email = $2
        `;
        
        const mediaResult = await pool.query(findMediaQuery, [mediaId, userEmail]);
        
        if (mediaResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                msg: 'Mídia não encontrada ou você não tem permissão para excluí-la'
            });
        }
        
        const media = mediaResult.rows[0];
        // Remover a extensão do filename para obter o UUID puro
        const hiveId = media.filename.split('.')[0]; // Remove a extensão para obter apenas o UUID
        
        logger.info(`Mídia encontrada - ID: ${media.id}, Hive ID (UUID): ${hiveId}`);
        
        // Deletar do Hive Storage primeiro
        let hiveDeleteSuccess = false;
        if (hiveId) {
            try {
                const deleteResponse = await fetch(`${process.env.MEDIA_STORAGE_API_URL}/api/media/${hiveId}`, {
                    method: 'DELETE',
                    headers: {
                        'x-api-key': process.env.MEDIA_STORAGE_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!deleteResponse.ok) {
                    const errorText = await deleteResponse.text();
                    logger.warn(`Erro ao deletar do Hive Storage (${deleteResponse.status}): ${errorText}`);
                    return res.status(500).json({
                        success: false,
                        message: 'Erro ao deletar mídia do Hive Storage',
                        error: errorText
                    });
                }
                
                const deleteResult = await deleteResponse.json();
                logger.info(`Mídia deletada do Hive Storage:`, deleteResult);
                hiveDeleteSuccess = true;
            } catch (hiveError) {
                logger.warn('Erro ao conectar com Hive Storage para exclusão:', hiveError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao conectar com Hive Storage para exclusão',
                    error: hiveError.message
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'ID do Hive Storage não encontrado'
            });
        }
        
        // Só deletar do banco se a exclusão do Hive Storage foi bem-sucedida
        if (!hiveDeleteSuccess) {
            return res.status(500).json({
                success: false,
                message: 'Falha ao deletar do Hive Storage - operação cancelada'
            });
        }
        
        // Deletar do banco de dados
        const deleteMediaQuery = `
            DELETE FROM conexbot.media
            WHERE id = $1 AND user_id = $2
            RETURNING id, filename
        `;
        
        const deleteResult = await pool.query(deleteMediaQuery, [mediaId, media.user_id]);
        
        if (deleteResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                msg: 'Erro ao deletar mídia do banco de dados'
            });
        }
        
        const deletedMedia = deleteResult.rows[0];
        logger.info(`Mídia deletada do banco de dados - ID: ${deletedMedia.id}, Filename: ${deletedMedia.filename}`);
        
        res.json({
            success: true,
            msg: 'Mídia deletada com sucesso',
            data: {
                id: deletedMedia.id,
                filename: deletedMedia.filename
            }
        });
        
    } catch (error) {
        logger.error('Erro ao deletar mídia:', error);
        res.status(500).json({
            success: false,
            msg: 'Erro interno do servidor'
        });
    }
};

// @route   POST api/profile/ia-status
// @desc    Update user's IA status
// @access  Private
exports.updateIAStatus = async (req, res) => {
    try {
        const { ia } = req.body;
        const userId = req.user.id;
        
        // Validar se ia é um boolean
        if (typeof ia !== 'boolean') {
            return res.status(400).json({ msg: 'O campo ia deve ser um boolean' });
        }
        
        // Atualizar o status da IA do usuário
        const query = 'UPDATE conexbot.users SET ia = $1 WHERE id = $2';
        await pool.query(query, [ia, userId]);
        
        logger.info(`Status IA atualizado para usuário ${userId}: ${ia}`);
        
        res.json({
            msg: 'Status IA atualizado com sucesso',
            ia: ia
        });
        
    } catch (err) {
        logger.error(`Erro ao atualizar status IA para usuário ${req.user.id}:`, err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   GET api/profile/config-status
// @desc    Get user's config interval
// @access  Private
exports.getConfigStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = 'SELECT config FROM conexbot.users WHERE id = $1';
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }
        
        const configInterval = result.rows[0].config || 10;
        
        res.json({
            config: configInterval
        });
        
    } catch (err) {
        logger.error(`Erro ao buscar config para usuário ${req.user.id}:`, err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   POST api/profile/config-status
// @desc    Update user's config interval
// @access  Private
exports.updateConfigStatus = async (req, res) => {
    try {
        const { config } = req.body;
        const userId = req.user.id;
        
        // Validar se config é um número inteiro positivo
        if (!Number.isInteger(config) || config <= 0) {
            return res.status(400).json({ msg: 'O campo config deve ser um número inteiro positivo' });
        }
        
        // Atualizar o intervalo de configuração do usuário
        const query = 'UPDATE conexbot.users SET config = $1 WHERE id = $2';
        await pool.query(query, [config, userId]);
        
        logger.info(`Config atualizado para usuário ${userId}: ${config}`);
        
        res.json({
            msg: 'Configuração atualizada com sucesso',
            config: config
        });
        
    } catch (err) {
        logger.error(`Erro ao atualizar config para usuário ${req.user.id}:`, err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   POST api/profile/message
// @desc    Save user's message
// @access  Private
exports.saveUserMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mensagem } = req.body;
        
        // Validar a mensagem
        if (mensagem === undefined) {
            return res.status(400).json({ 
                success: false,
                msg: 'Conteúdo da mensagem é obrigatório' 
            });
        }
        
        // Atualizar a mensagem do usuário no banco de dados
        const result = await pool.query(
            'UPDATE conexbot.users SET mensagem = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
            [mensagem, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                msg: 'Usuário não encontrado' 
            });
        }
        
        logger.info(`Usuário ${req.user.email} atualizou sua mensagem`);
        
        res.json({
            success: true,
            msg: 'Mensagem salva com sucesso'
        });
    } catch (err) {
        logger.error(`Erro ao salvar mensagem do usuário ${req.user.email}:`, err.message);
        res.status(500).json({
            success: false,
            msg: 'Erro no servidor'
        });
    }
};

// @route   POST api/profile/contacts
// @desc    Save user's contacts
// @access  Private
exports.saveUserContacts = async (req, res) => {
    try {
        const { contacts } = req.body;
        
        // Validar se contacts é um array
        if (!Array.isArray(contacts)) {
            return res.status(400).json({ msg: 'Contacts deve ser um array' });
        }
        
        // Validar estrutura dos contatos
        for (let contact of contacts) {
            if (!contact.name || !contact.phone) {
                return res.status(400).json({ msg: 'Cada contato deve ter nome e telefone' });
            }
        }
        
        const userId = req.user.id;
        
        // Atualizar a coluna contacts do usuário
        const query = 'UPDATE conexbot.users SET contacts = $1 WHERE id = $2';
        await pool.query(query, [JSON.stringify(contacts), userId]);
        
        logger.info(`Contatos salvos para usuário ${userId}: ${contacts.length} contatos`);
        
        res.json({
            msg: 'Contatos salvos com sucesso',
            count: contacts.length
        });
        
    } catch (err) {
        logger.error(`Erro ao salvar contatos para usuário ${req.user.id}:`, err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @route   GET api/profile/contacts
// @desc    Get user's contacts
// @access  Private
exports.getUserContacts = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = 'SELECT contacts FROM conexbot.users WHERE id = $1';
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }
        
        const contacts = result.rows[0].contacts || [];
        
        res.json({
            contacts: contacts,
            count: contacts.length
        });
        
    } catch (err) {
        logger.error(`Erro ao buscar contatos para usuário ${req.user.id}:`, err.message);
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
