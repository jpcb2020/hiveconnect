const logger = require('./logger');
const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config();

// Configurações da API WhatsApp baseadas nas variáveis de ambiente
const WHATSAPP_API_CONFIG = {
    baseURL: process.env.WHATSAPP_API_URL || 'https://dify-hiveapi.ld9tly.easypanel.host',
    apiKey: process.env.WHATSAPP_API_KEY || '47ec728124b69c04843556078d9033c41ace727c653a6d0072951420d4cdfc17'
};

// Log das configurações carregadas (sem expor a API key completa)
logger.info(`Configurações WhatsApp carregadas: ${WHATSAPP_API_CONFIG.baseURL} (API Key: ${WHATSAPP_API_CONFIG.apiKey.substring(0, 8)}...)`);

/**
 * Função auxiliar para fazer requisições à API WhatsApp
 * @param {string} endpoint - Endpoint da API (sem a base URL)
 * @param {string} method - Método HTTP (GET, POST, etc.)
 * @param {object} data - Dados para enviar no corpo da requisição
 * @returns {Promise<object>} - Resposta da API
 */
async function callHiveWPAPI(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`/api/whatsapp/${endpoint}`, WHATSAPP_API_CONFIG.baseURL);
        const httpModule = url.protocol === 'https:' ? https : http;
        
        const requestBody = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WHATSAPP_API_CONFIG.apiKey}`
            }
        };

        if (requestBody) {
            options.headers['Content-Length'] = Buffer.byteLength(requestBody);
        }

        const req = httpModule.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const jsonResponse = JSON.parse(responseData);
                        resolve(jsonResponse);
                    } else {
                        reject(new Error(`Erro ${res.statusCode}: ${res.statusMessage} - ${responseData}`));
                    }
                } catch (parseError) {
                    reject(new Error(`Erro ao fazer parse da resposta: ${parseError.message}`));
                }
            });
        });

        req.on('error', (error) => {
            logger.error(`Falha na operação ${endpoint}:`, error.message);
            reject(error);
        });

        if (requestBody) {
            req.write(requestBody);
        }

        req.end();
    });
}

/**
 * Cria uma nova instância do WhatsApp para um usuário
 * @param {string} userEmail - Email do usuário que será usado como clientId
 * @param {object} options - Opções adicionais para a instância
 * @returns {Promise<object>} - Resultado da criação da instância
 */
async function createWhatsAppInstance(userEmail, options = {}) {
    try {
        // Usar o email como clientId (sanitizado para evitar caracteres especiais)
        const clientId = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_').toLowerCase(); 
        
        const instanceConfig = {
            clientId: clientId,
            ignoreGroups: options.ignoreGroups !== undefined ? options.ignoreGroups : (process.env.WHATSAPP_IGNORE_GROUPS === 'true'),
            ...options
        };

        // Se foi fornecida uma URL de webhook, incluir na configuração
        if (options.webhookUrl) {
            instanceConfig.webhookUrl = options.webhookUrl;
        }

        // Se foi fornecida uma URL de proxy, incluir na configuração
        if (options.proxyUrl) {
            instanceConfig.proxyUrl = options.proxyUrl;
        }

        logger.info(`Criando instância WhatsApp para usuário: ${userEmail} (clientId: ${clientId})`);
        
        const result = await callHiveWPAPI('instance/init', 'POST', instanceConfig);
        
        logger.info(`Instância WhatsApp criada com sucesso para ${userEmail}:`, result);
        
        return {
            success: true,
            clientId: clientId,
            result: result,
            qrCodeUrl: `${WHATSAPP_API_CONFIG.baseURL}/api/whatsapp/qr-image?clientId=${clientId}`
        };
    } catch (error) {
        logger.error(`Erro ao criar instância WhatsApp para ${userEmail}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Deleta uma instância do WhatsApp
 * @param {string} userEmail - Email do usuário
 * @returns {Promise<object>} - Resultado da operação
 */
async function deleteWhatsAppInstance(userEmail) {
    try {
        const clientId = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_').toLowerCase();
        
        logger.info(`Deletando instância WhatsApp para usuário: ${userEmail} (clientId: ${clientId})`);
        
        const result = await callHiveWPAPI('instance/delete', 'POST', { clientId });
        
        logger.info(`Instância WhatsApp deletada com sucesso para ${userEmail}`);
        
        return {
            success: true,
            result: result
        };
    } catch (error) {
        logger.error(`Erro ao deletar instância WhatsApp para ${userEmail}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Verifica o status de uma instância do WhatsApp
 * @param {string} userEmail - Email do usuário
 * @returns {Promise<object>} - Status da instância
 */
async function getWhatsAppInstanceStatus(userEmail) {
    try {
        const clientId = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_').toLowerCase();
        
        const result = await callHiveWPAPI(`status?clientId=${clientId}`, 'GET');
        
        return {
            success: true,
            clientId: clientId,
            status: result
        };
    } catch (error) {
        logger.error(`Erro ao verificar status da instância WhatsApp para ${userEmail}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Lista todas as instâncias ativas
 * @returns {Promise<object>} - Lista de instâncias
 */
async function listAllWhatsAppInstances() {
    try {
        const result = await callHiveWPAPI('instances', 'GET');
        
        return {
            success: true,
            instances: result.instances || []
        };
    } catch (error) {
        logger.error('Erro ao listar instâncias WhatsApp:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Envia uma mensagem de texto
 * @param {string} userEmail - Email do usuário (dono da instância)
 * @param {string} phoneNumber - Número de telefone do destinatário
 * @param {string} message - Mensagem a ser enviada
 * @param {object} options - Opções adicionais (simulateTyping, etc.)
 * @returns {Promise<object>} - Resultado do envio
 */
async function sendTextMessage(userEmail, phoneNumber, message, options = {}) {
    try {
        const clientId = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_').toLowerCase();
        
        const messageConfig = {
            clientId: clientId,
            phoneNumber: phoneNumber,
            message: message,
            simulateTyping: options.simulateTyping || false,
            typingDurationMs: options.typingDurationMs || 1500
        };

        const result = await callHiveWPAPI('send/text', 'POST', messageConfig);
        
        logger.info(`Mensagem enviada via WhatsApp por ${userEmail} para ${phoneNumber}`);
        
        return {
            success: true,
            result: result
        };
    } catch (error) {
        logger.error(`Erro ao enviar mensagem WhatsApp por ${userEmail}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Obtém o QR Code em formato base64 para autenticação
 * @param {string} userEmail - Email do usuário
 * @returns {Promise<object>} - QR Code em base64 e status
 */
async function getWhatsAppQRCode(userEmail) {
    try {
        const clientId = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_').toLowerCase();
        
        const result = await callHiveWPAPI(`qr?clientId=${clientId}`, 'GET');
        
        return {
            success: true,
            clientId: clientId,
            qrCode: result.qrCode,
            status: result.status
        };
    } catch (error) {
        logger.error(`Erro ao obter QR Code WhatsApp para ${userEmail}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Desconecta uma instância do WhatsApp (logout)
 * @param {string} userEmail - Email do usuário
 * @returns {Promise<object>} - Resultado do logout
 */
async function logoutWhatsAppInstance(userEmail) {
    try {
        const clientId = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_').toLowerCase();
        
        logger.info(`Fazendo logout da instância WhatsApp para usuário: ${userEmail} (clientId: ${clientId})`);
        
        const result = await callHiveWPAPI('logout', 'POST', { clientId });
        
        logger.info(`Logout WhatsApp realizado com sucesso para ${userEmail}`);
        
        return {
            success: true,
            result: result
        };
    } catch (error) {
        logger.error(`Erro ao fazer logout WhatsApp para ${userEmail}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    createWhatsAppInstance,
    deleteWhatsAppInstance,
    getWhatsAppInstanceStatus,
    listAllWhatsAppInstances,
    sendTextMessage,
    getWhatsAppQRCode,
    logoutWhatsAppInstance,
    callHiveWPAPI
}; 