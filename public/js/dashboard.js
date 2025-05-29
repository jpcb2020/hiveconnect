/* 
 * DASHBOARD.JS - JavaScript específico para o Dashboard do ConexBot
 * Usado em: dashboard.ejs
 * Funcionalidades: Interações do dashboard, logout, menu mobile
 * Dependências: auth.js
 * 
 * MELHORIAS DE SEGURANÇA IMPLEMENTADAS:
 * - Verificação de autenticação no carregamento
 * - Verificação periódica de token (a cada 5 minutos)
 * - Função auxiliar para requisições autenticadas
 * - Tratamento automático de tokens expirados
 * - Integração real com API WhatsApp usando o email do JWT
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard carregado');
    
    // Verificar autenticação no carregamento
    checkAuthenticationStatus();
    
    // Elementos do DOM
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const loadingScreen = document.getElementById('loading-screen');
    const settingsToggle = document.getElementById('settingsToggle');
    const broadcastSection = document.querySelector('.broadcast-section');

    // Esconder tela de loading após carregar
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }, 1000);
    }

    // Toggle do dropdown de perfil
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }

    // Toggle do menu mobile
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Toggle configurações de disparos
    if (settingsToggle && broadcastSection) {
        settingsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            broadcastSection.classList.toggle('active');
            
            // Atualizar classe active no link
            settingsToggle.classList.toggle('active');
            
            // Remover active de outros links do menu
            const allNavLinks = document.querySelectorAll('.nav-links a');
            allNavLinks.forEach(link => {
                if (link !== settingsToggle) {
                    link.classList.remove('active');
                }
            });
            
            console.log('Toggle configurações:', broadcastSection.classList.contains('active'));
        });
    }

    // Inicializar funcionalidades do dashboard
    initializeDashboardFeatures();
    
    // Verificar token periodicamente (a cada 5 minutos)
    setInterval(checkAuthenticationStatus, 5 * 60 * 1000);
});

// Função de logout
function handleLogout() {
    if (typeof AuthManager !== 'undefined') {
        AuthManager.logout();
    } else {
        // Fallback se AuthManager não estiver disponível
        console.error('AuthManager não disponível, fazendo logout direto');
        localStorage.clear();
        sessionStorage.clear();
        // Limpar cookies manualmente
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        window.location.href = '/login';
    }
}

// Verificar status de autenticação
function checkAuthenticationStatus() {
    if (typeof AuthManager === 'undefined') {
        console.error('AuthManager não encontrado! Redirecionando para login...');
        window.location.href = '/login';
        return false;
    }
    
    // Verificar se está autenticado
    if (!AuthManager.isAuthenticated()) {
        console.warn('Usuário não autenticado, redirecionando para login...');
        window.location.href = '/login';
        return false;
    }
    
    // Verificar se o token não expirou
    if (AuthManager.isTokenExpired()) {
        console.warn('Token expirado, fazendo logout...');
        AuthManager.logout();
        return false;
    }
    
    return true;
}

// Inicializar funcionalidades específicas do dashboard
function initializeDashboardFeatures() {
    // Inicializar funcionalidades de contatos
    initializeContactFeatures();
    
    // Inicializar funcionalidades de mensagens
    initializeMessageFeatures();
    
    // Inicializar configurações de disparo
    initializeBroadcastSettings();
    
    // Inicializar conexão WhatsApp
    initializeWhatsAppConnection();
}

// Funcionalidades de contatos
function initializeContactFeatures() {
    const uploadBtn = document.querySelector('.upload-btn');
    const fileUpload = document.getElementById('fileUpload');
    const clearContactsBtn = document.getElementById('clearContactsBtn');
    const manualImportBtn = document.getElementById('manualImportBtn');

    // Upload de arquivo
    if (uploadBtn && fileUpload) {
        uploadBtn.addEventListener('click', () => {
            fileUpload.click();
        });

        fileUpload.addEventListener('change', handleFileUpload);
    }

    // Botão limpar contatos
    if (clearContactsBtn) {
        clearContactsBtn.addEventListener('click', clearContacts);
    }

    // Botão importação manual
    if (manualImportBtn) {
        manualImportBtn.addEventListener('click', () => {
            // Implementar modal de importação manual
            console.log('Abrir modal de importação manual');
        });
    }

    // Menu flutuante
    initializeFloatingMenu();
}

// Funcionalidades de mensagens
function initializeMessageFeatures() {
    const nameVarBtn = document.getElementById('nameVarBtn');
    const spintaxBtn = document.getElementById('spintaxBtn');
    const spintaxModal = document.getElementById('spintaxModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const insertSpintaxBtn = document.getElementById('insertSpintax');

    // Botão variável nome
    if (nameVarBtn) {
        nameVarBtn.addEventListener('click', () => {
            insertTextAtCursor('{{nome}}');
        });
    }

    // Botão Spintax
    if (spintaxBtn && spintaxModal) {
        spintaxBtn.addEventListener('click', () => {
            spintaxModal.classList.add('active');
        });
    }

    // Fechar modais
    if (closeModalBtns) {
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            });
        });
    }

    // Inserir Spintax
    if (insertSpintaxBtn) {
        insertSpintaxBtn.addEventListener('click', insertSpintax);
    }

    // Botões de anexo
    initializeAttachments();
}

// Configurações de disparo
function initializeBroadcastSettings() {
    const saveSettingsBtn = document.querySelector('.save-settings-btn');
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveBroadcastSettings);
    }
}

// Conexão WhatsApp
function initializeWhatsAppConnection() {
    const connectBtn = document.getElementById('connectWhatsApp');
    const disconnectBtn = document.getElementById('disconnectWhatsApp');
    const refreshBtn = document.getElementById('refreshQR');

    if (connectBtn) {
        connectBtn.addEventListener('click', connectWhatsApp);
    }

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWhatsApp);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshQRCode);
    }

    // Verificar status inicial
    checkWhatsAppStatus();
    
    // Verificar status periodicamente (a cada 10 segundos)
    setInterval(checkWhatsAppStatus, 10000);
}

async function checkWhatsAppStatus() {
    try {
        const response = await authenticatedFetch('/api/profile/whatsapp/status');
        const data = await response.json();
        
        if (response.ok && data.status) {
            console.log('Status WhatsApp recebido:', data);
            updateConnectionUI(data);
        } else {
            // Status não encontrado - provavelmente não conectado
            console.log('Status não encontrado ou resposta inválida:', data);
            updateConnectionUI({ status: 'disconnected' });
        }
    } catch (error) {
        console.error('Erro ao verificar status WhatsApp:', error);
        updateConnectionUI({ status: 'disconnected' });
    }
}

function updateConnectionUI(statusData) {
    const connectionStatus = document.getElementById('connectionStatus');
    const connectBtn = document.getElementById('connectWhatsApp');
    const disconnectBtn = document.getElementById('disconnectWhatsApp');
    const refreshBtn = document.getElementById('refreshQR');
    const qrContainer = document.getElementById('qrContainer');
    
    if (!connectionStatus || !connectBtn || !disconnectBtn || !refreshBtn || !qrContainer) {
        return;
    }

    // Verificar se statusData tem a estrutura aninhada
    let status;
    let isConnected = false;
    
    if (statusData.status && typeof statusData.status === 'object') {
        // Estrutura aninhada: statusData.status.status e statusData.status.connected
        status = statusData.status.status;
        isConnected = statusData.status.connected === true;
    } else {
        // Estrutura simples: statusData.status
        status = statusData.status;
        isConnected = status === 'connected' || status === 'open';
    }

    console.log('Status processado:', { status, isConnected, originalData: statusData });

    // Verificar mudanças de status e notificar
    if (previousWhatsAppStatus !== null && previousWhatsAppStatus !== status) {
        handleStatusChange(status, previousWhatsAppStatus);
    }
    previousWhatsAppStatus = status;

    if (isConnected && (status === 'open' || status === 'connected')) {
        // WhatsApp está conectado e funcionando
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Conectado';
        connectionStatus.className = 'connection-status connected';
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'block';
        refreshBtn.style.display = 'none';
        
        qrContainer.innerHTML = `
            <div class="qr-placeholder connected">
                <i class="fas fa-check-circle"></i>
                <p><strong>WhatsApp Conectado!</strong></p>
                <p class="connection-details">Pronto para enviar mensagens</p>
            </div>
        `;
        
        // Só mostrar notificação na primeira vez ou quando reconectar
        // Mas não na primeira verificação (quando previousWhatsAppStatus é null)
        if (previousWhatsAppStatus !== null && previousWhatsAppStatus !== status) {
            // A notificação já foi disparada pela função handleStatusChange
            console.log('Status changed to connected, notification handled by handleStatusChange');
        }
    } else if (status === 'connecting' || status === 'qr' || status === 'qr_code') {
        // Aguardando conexão via QR Code
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Aguardando QR Code';
        connectionStatus.className = 'connection-status connecting';
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'block';
        refreshBtn.style.display = 'block';
        console.log('Status QR Code ativo, aguardando escaneamento...');
    } else if (status === 'close' || status === 'closed') {
        // Conexão fechada/perdida
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Conexão Perdida';
        connectionStatus.className = 'connection-status disconnected';
        connectBtn.style.display = 'block';
        disconnectBtn.style.display = 'none';
        refreshBtn.style.display = 'none';
        qrContainer.innerHTML = `
            <div class="qr-placeholder disconnected">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Conexão perdida</p>
                <p class="connection-details">Clique em "Iniciar Conexão" para reconectar</p>
            </div>
        `;
    } else {
        // Estado desconectado padrão
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Desconectado';
        connectionStatus.className = 'connection-status disconnected';
        connectBtn.style.display = 'block';
        disconnectBtn.style.display = 'none';
        refreshBtn.style.display = 'none';
        qrContainer.innerHTML = `
            <div class="qr-placeholder">
                <i class="fas fa-qrcode"></i>
                <p>Aguardando QR Code</p>
                <p class="connection-details">Clique em "Iniciar Conexão" para começar</p>
            </div>
        `;
    }
}

async function fetchAndDisplayQRCode() {
    try {
        const response = await authenticatedFetch('/api/profile/whatsapp/qr');
        const data = await response.json();
        
        if (response.ok && data.success && data.qrCode) {
            const qrContainer = document.getElementById('qrContainer');
            qrContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code WhatsApp">`;
        } else {
            console.log('QR Code não disponível:', data.msg || 'Erro desconhecido');
        }
    } catch (error) {
        console.error('Erro ao buscar QR Code:', error);
    }
}

async function connectWhatsApp() {
    const connectBtn = document.getElementById('connectWhatsApp');
    
    if (!checkAuthenticationStatus()) {
        return;
    }

    connectBtn.textContent = 'Conectando...';
    connectBtn.disabled = true;
    
    try {
        // Criar uma nova instância WhatsApp
        const createResponse = await authenticatedFetch('/api/profile/whatsapp/create-instance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                options: {
                    ignoreGroups: true
                }
            })
        });

        const createData = await createResponse.json();

        if (createResponse.ok && createData.success) {
            showNotification('Instância WhatsApp criada! Carregando QR Code...', 'success');
            
            // Aguardar um pouco antes de buscar o QR Code
            setTimeout(async () => {
                try {
                    await fetchAndDisplayQRCode();
                    updateConnectionUI({ status: 'qr_code' });
                    showNotification('QR Code carregado! Escaneie com seu WhatsApp.', 'info');
                } catch (qrError) {
                    console.error('Erro ao buscar QR Code:', qrError);
                    showNotification('Instância criada, mas erro ao carregar QR Code. Tente atualizar.', 'warning');
                }
            }, 2000);
        } else {
            showNotification(createData.msg || 'Erro ao criar instância WhatsApp', 'error');
        }
    } catch (error) {
        console.error('Erro ao conectar WhatsApp:', error);
        showNotification('Erro ao conectar WhatsApp', 'error');
    } finally {
        connectBtn.textContent = 'Iniciar Conexão';
        connectBtn.disabled = false;
    }
}

async function disconnectWhatsApp() {
    if (!checkAuthenticationStatus()) {
        return;
    }

    if (!confirm('Tem certeza que deseja desconectar do WhatsApp?')) {
        return;
    }

    const disconnectBtn = document.getElementById('disconnectWhatsApp');
    disconnectBtn.textContent = 'Desconectando...';
    disconnectBtn.disabled = true;

    try {
        const response = await authenticatedFetch('/api/profile/whatsapp/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification('WhatsApp desconectado com sucesso!', 'success');
            updateConnectionUI({ status: 'disconnected' });
        } else {
            showNotification(data.msg || 'Erro ao desconectar WhatsApp', 'error');
        }
    } catch (error) {
        console.error('Erro ao desconectar WhatsApp:', error);
        showNotification('Erro ao desconectar WhatsApp', 'error');
    } finally {
        disconnectBtn.textContent = 'Desconectar';
        disconnectBtn.disabled = false;
    }
}

async function refreshQRCode() {
    const refreshBtn = document.getElementById('refreshQR');
    const originalText = refreshBtn.innerHTML;
    
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Atualizando...';
    refreshBtn.disabled = true;

    try {
        await fetchAndDisplayQRCode();
        showNotification('QR Code atualizado!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar QR Code:', error);
        showNotification('Erro ao atualizar QR Code', 'error');
    } finally {
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
    }
}

// Menu flutuante
function initializeFloatingMenu() {
    const floatingMenuBtn = document.querySelector('.floating-menu-button');
    const floatingMenu = document.querySelector('.floating-menu');

    if (floatingMenuBtn && floatingMenu) {
        floatingMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            floatingMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!floatingMenu.contains(e.target) && !floatingMenuBtn.contains(e.target)) {
                floatingMenu.classList.remove('active');
            }
        });
    }
}

// Funções utilitárias
function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        console.log('Arquivos selecionados:', files);
        // Implementar lógica de upload
        showNotification('Arquivo(s) carregado(s) com sucesso!', 'success');
    }
}

function clearContacts() {
    if (confirm('Tem certeza que deseja limpar todos os contatos?')) {
        // Implementar lógica de limpeza
        updateContactStats(0, 0);
        document.getElementById('contactTableBody').innerHTML = '';
        showNotification('Contatos limpos com sucesso!', 'success');
    }
}

function insertTextAtCursor(text) {
    const messageContent = document.getElementById('messageContent');
    if (messageContent) {
        const startPos = messageContent.selectionStart;
        const endPos = messageContent.selectionEnd;
        messageContent.value = messageContent.value.substring(0, startPos) 
            + text 
            + messageContent.value.substring(endPos, messageContent.value.length);
        messageContent.selectionStart = messageContent.selectionEnd = startPos + text.length;
        messageContent.focus();
    }
}

function insertSpintax() {
    const spintaxInput = document.getElementById('spintaxInput');
    if (spintaxInput && spintaxInput.value.trim()) {
        const lines = spintaxInput.value.trim().split('\n');
        const spintaxText = '{' + lines.join('|') + '}';
        insertTextAtCursor(spintaxText);
        spintaxInput.value = '';
        document.getElementById('spintaxModal').classList.remove('active');
        showNotification('Spintax inserido com sucesso!', 'success');
    }
}

function initializeAttachments() {
    const attachmentInputs = ['imageUpload', 'videoUpload', 'audioUpload', 'documentUpload'];
    
    attachmentInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', (e) => {
                console.log(`${inputId} files:`, e.target.files);
                // Implementar preview de anexos
            });
        }
    });
}

function saveBroadcastSettings() {
    const messageInterval = document.getElementById('messageInterval').value;
    const deliverySpeed = document.getElementById('deliverySpeed').value;
    
    // Simular salvamento
    console.log('Salvando configurações:', { messageInterval, deliverySpeed });
    showNotification('Configurações salvas com sucesso!', 'success');
}

function updateContactStats(total, valid) {
    const totalElement = document.getElementById('totalContacts');
    const validElement = document.getElementById('validContacts');
    
    if (totalElement) totalElement.textContent = total;
    if (validElement) validElement.textContent = valid;
}

function showNotification(message, type = 'info') {
    // Criar notificação simples
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    /* Estilos para feedback visual do WhatsApp */
    .qr-placeholder.connected {
        background: transparent;
        color: #059669;
        border: 2px dashed #10b981;
        animation: connectedPulse 2s ease-in-out;
        padding: 30px 20px;
        border-radius: 12px;
        text-align: center;
    }
    
    .qr-placeholder.connected i {
        color: #10b981;
        font-size: 3.5rem;
        margin-bottom: 15px;
        animation: checkBounce 0.6s ease-out;
        display: block;
    }
    
    .qr-placeholder.connected p {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #059669;
    }
    
    .qr-placeholder.disconnected {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border: 2px solid #ef4444;
        padding: 30px 20px;
        border-radius: 12px;
        text-align: center;
    }
    
    .qr-placeholder.disconnected i {
        color: #ffffff;
        font-size: 2.5rem;
        margin-bottom: 10px;
        display: block;
    }
    
    .connection-details {
        font-size: 0.9rem;
        opacity: 0.8;
        margin-top: 8px;
        font-weight: 400;
        color: #6b7280;
    }
    
    .connection-status.connected {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        animation: statusGlow 2s ease-in-out;
        box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        border-radius: 20px;
        padding: 8px 16px;
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    .connection-status.connecting {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        animation: connectingPulse 2s infinite;
        border-radius: 20px;
        padding: 8px 16px;
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    .connection-status.disconnected {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        color: white;
        border-radius: 20px;
        padding: 8px 16px;
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    @keyframes connectedPulse {
        0% { transform: scale(1); border-color: #10b981; }
        50% { transform: scale(1.02); border-color: #059669; }
        100% { transform: scale(1); border-color: #10b981; }
    }
    
    @keyframes checkBounce {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    @keyframes statusGlow {
        0% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
        50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.5); }
        100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
    }
    
    @keyframes connectingPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;
document.head.appendChild(style);

// Tornar handleLogout global para ser chamado pelo onclick
window.handleLogout = handleLogout; 

// Função auxiliar para fazer requisições autenticadas
async function authenticatedFetch(url, options = {}) {
    // Verificar autenticação antes da requisição
    if (!checkAuthenticationStatus()) {
        throw new Error('Não autenticado');
    }
    
    // Adicionar headers de autenticação
    const authHeaders = AuthManager.getAuthHeaders();
    options.headers = {
        ...authHeaders,
        ...(options.headers || {})
    };
    
    try {
        const response = await fetch(url, options);
        
        // Verificar se o token expirou
        if (response.status === 401) {
            console.warn('Token expirado durante requisição, fazendo logout...');
            AuthManager.logout();
            throw new Error('Token expirado');
        }
        
        return response;
    } catch (error) {
        console.error('Erro na requisição autenticada:', error);
        throw error;
    }
}

// Função para notificar mudanças de status importantes
function handleStatusChange(newStatus, previousStatus) {
    // Se mudou de desconectado para conectado
    if (previousStatus !== 'open' && newStatus === 'open') {
        showNotification('🎉 WhatsApp conectado com sucesso!', 'success');
        console.log('WhatsApp conectado!');
    }
    
    // Se mudou de conectado para desconectado
    if (previousStatus === 'open' && newStatus !== 'open') {
        showNotification('⚠️ WhatsApp foi desconectado. Verifique sua conexão.', 'warning');
        console.log('WhatsApp desconectado!');
    }
}

// Variável para armazenar o status anterior
let previousWhatsAppStatus = null; 