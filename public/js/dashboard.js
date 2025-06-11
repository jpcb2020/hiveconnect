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

// Variáveis globais para controle do WhatsApp
let userInitiatedConnection = false; // Controla se o usuário iniciou a conexão
let isInitialStatusCheck = true; // Flag para identificar verificação inicial do status
let statusMonitoringInterval = null;
let isFetchingQRCode = false;
let previousWhatsAppStatus = null;

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
            
            // Rolar página ao topo quando abrir configurações
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
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

    // Garantir que o estado inicial esteja correto
    resetConnectionState();
    
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
        manualImportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                showManualImportModal();
            } catch (error) {
                console.error('Erro ao abrir modal:', error);
                alert('Erro ao abrir modal: ' + error.message);
            }
        });
    } else {
        console.error('Botão de importação manual não encontrado!');
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
    if (spintaxBtn) {
        spintaxBtn.addEventListener('click', () => {
            if (spintaxModal) {
                spintaxModal.classList.add('active');
            }
        });
    }

    // Fechar modal
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (spintaxModal) {
                spintaxModal.classList.remove('active');
            }
        });
    });

    // Inserir Spintax
    if (insertSpintaxBtn) {
        insertSpintaxBtn.addEventListener('click', insertSpintax);
    }

    // Fechar modal ao clicar fora
    if (spintaxModal) {
        spintaxModal.addEventListener('click', (e) => {
            if (e.target === spintaxModal) {
                spintaxModal.classList.remove('active');
            }
        });
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

    // Fazer uma verificação inicial de status ao carregar a página
    console.log('Verificando status inicial do WhatsApp...');
    checkWhatsAppStatus().then(() => {
        console.log('Verificação inicial concluída');
    }).catch(error => {
        console.error('Erro na verificação inicial:', error);
        // Se houver erro, inicializar como desconectado
        updateConnectionUI({ status: 'disconnected' });
    });
}

async function checkWhatsAppStatus() {
    try {
        console.log('Verificando status do WhatsApp...');
        const response = await authenticatedFetch('/api/profile/whatsapp/status');
        const data = await response.json();
        
        console.log('Resposta do status WhatsApp:', { status: response.status, data });
        
        if (response.ok && data.status) {
            console.log('Status WhatsApp recebido:', data);
            updateConnectionUI(data);
            
            // Iniciar monitoramento apenas se usuário iniciou conexão OU se já está conectado
            const status = data.status.status || data.status;
            if ((status === 'open' || status === 'connected') || 
                (userInitiatedConnection && (status === 'connecting' || status === 'qr' || status === 'qr_code' || status === 'disconnected' || status === 'disconnect'))) {
                if (!statusMonitoringInterval) {
                    startStatusMonitoring();
                }
            }
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

// Função para iniciar monitoramento de status
function startStatusMonitoring() {
    // Se já existe um intervalo, limpar antes
    if (statusMonitoringInterval) {
        clearInterval(statusMonitoringInterval);
    }
    
    // Iniciar verificação a cada 3 segundos (antes eram 10)
    statusMonitoringInterval = setInterval(checkWhatsAppStatus, 3000);
    console.log('Monitoramento de status WhatsApp iniciado (intervalo: 3s)');
}

// Função para parar monitoramento de status
function stopStatusMonitoring() {
    if (statusMonitoringInterval) {
        clearInterval(statusMonitoringInterval);
        statusMonitoringInterval = null;
        console.log('Monitoramento de status WhatsApp parado');
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

    // REGRA ESPECIAL: Na verificação inicial, tratar "connecting" como "desconectado"
    if (isInitialStatusCheck && status === 'connecting') {
        console.log('Status inicial "connecting" tratado como desconectado');
        status = 'disconnected'; // Forçar status como desconectado
        isConnected = false; // Garantir que não seja considerado conectado
    }

    // Marcar que a verificação inicial foi concluída
    if (isInitialStatusCheck) {
        isInitialStatusCheck = false;
        console.log('Verificação inicial concluída');
    }

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
        // Só mostrar como aguardando QR Code se o usuário iniciou a conexão
        if (userInitiatedConnection) {
            // Aguardando conexão via QR Code (usuário iniciou conexão)
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Aguardando QR Code';
            connectionStatus.className = 'connection-status connecting';
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';
            refreshBtn.style.display = 'block';
            console.log('Status QR Code ativo, aguardando escaneamento...', status);
            
            console.log('Buscando QR Code automaticamente para status:', status);
            fetchAndDisplayQRCode().catch(error => {
                console.error('Erro ao buscar QR Code automaticamente:', error);
            });
        } else {
            // Mostrar como desconectado quando conexão não foi iniciada pelo usuário
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Desconectado';
            connectionStatus.className = 'connection-status disconnected';
            connectBtn.style.display = 'block';
            disconnectBtn.style.display = 'none';
            refreshBtn.style.display = 'none';
            qrContainer.innerHTML = `
                <div class="qr-placeholder">
                    <i class="fas fa-qrcode"></i>
                    <p>WhatsApp Desconectado</p>
                    <p class="connection-details">Clique em "Iniciar Conexão" para começar</p>
                </div>
            `;
        }
    } else if (status === 'close' || status === 'closed') {
        // Instância existe mas está desconectada - tratar como desconectado
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Desconectado';
        connectionStatus.className = 'connection-status disconnected';
        connectBtn.style.display = 'block';
        disconnectBtn.style.display = 'none';
        refreshBtn.style.display = 'none';
        console.log('WhatsApp desconectado (instância inativa):', status);
        qrContainer.innerHTML = `
            <div class="qr-placeholder">
                <i class="fas fa-qrcode"></i>
                <p>WhatsApp Desconectado</p>
                <p class="connection-details">Clique em "Iniciar Conexão" para começar</p>
            </div>
        `;
    } else {
        // Verificar se usuário iniciou conexão e status é disconnected
        if (userInitiatedConnection && (status === 'disconnected' || status === 'disconnect')) {
            // Estado especial: usuário iniciou conexão mas status ainda é disconnected
            // Isso significa que o sistema está conectando ao WhatsApp
            connectionStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando ao WhatsApp';
            connectionStatus.className = 'connection-status connecting';
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';
            refreshBtn.style.display = 'none';
            console.log('🔄 Estado especial detectado: usuário iniciou conexão, status disconnected - sistema conectando ao WhatsApp...');
            
            qrContainer.innerHTML = `
                <div class="qr-placeholder connecting">
                    <div class="connecting-animation">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p><strong>Conectando ao WhatsApp...</strong></p>
                    <p class="connection-details">Aguarde enquanto estabelecemos a conexão</p>
                    <div class="connecting-dots">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                </div>
            `;
        } else {
            // Estado desconectado padrão (outros status não reconhecidos)
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Desconectado';
            connectionStatus.className = 'connection-status disconnected';
            connectBtn.style.display = 'block';
            disconnectBtn.style.display = 'none';
            refreshBtn.style.display = 'none';
            qrContainer.innerHTML = `
                <div class="qr-placeholder">
                    <i class="fas fa-qrcode"></i>
                    <p>WhatsApp Desconectado</p>
                    <p class="connection-details">Clique em "Iniciar Conexão" para começar</p>
                </div>
            `;
        }
    }
}

async function fetchAndDisplayQRCode() {
    // Evitar múltiplas chamadas simultâneas
    if (isFetchingQRCode) {
        console.log('QR Code já está sendo buscado, aguardando...');
        return;
    }
    
    isFetchingQRCode = true;
    
    try {
        console.log('Iniciando busca do QR Code...');
        const response = await authenticatedFetch('/api/profile/whatsapp/qr');
        const data = await response.json();
        
        console.log('Resposta da API QR Code:', { status: response.status, data });
        
        if (response.ok && data.success && data.qrCode) {
            const qrContainer = document.getElementById('qrContainer');
            qrContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code WhatsApp" style="max-width: 100%; height: auto; border-radius: 8px;">`;
            console.log('QR Code exibido com sucesso!');
        } else {
            console.log('QR Code não disponível:', data);
            const qrContainer = document.getElementById('qrContainer');
            qrContainer.innerHTML = `
                <div class="qr-placeholder">
                    <i class="fas fa-qrcode"></i>
                    <p>QR Code não disponível</p>
                    <p class="connection-details">Tente atualizar ou iniciar nova conexão</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao buscar QR Code:', error);
        const qrContainer = document.getElementById('qrContainer');
        qrContainer.innerHTML = `
            <div class="qr-placeholder error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar QR Code</p>
                <p class="connection-details">Verifique sua conexão e tente novamente</p>
            </div>
        `;
    } finally {
        isFetchingQRCode = false;
    }
}

async function connectWhatsApp() {
    const connectBtn = document.getElementById('connectWhatsApp');
    
    if (!checkAuthenticationStatus()) {
        return;
    }

    // ALTERAÇÃO PRINCIPAL: Definir que foi iniciado pelo usuário
    userInitiatedConnection = true;
    console.log('Usuário iniciou conexão WhatsApp - userInitiatedConnection:', userInitiatedConnection);

    connectBtn.textContent = 'Conectando...';
    connectBtn.disabled = true;
    
    try {
        // Ir direto para buscar o QR Code sem criar instância
        showNotification('Carregando QR Code...', 'info');
            
            // Aguardar um pouco antes de buscar o QR Code
            setTimeout(async () => {
                try {
                    await fetchAndDisplayQRCode();
                    updateConnectionUI({ status: 'qr_code' });
                    showNotification('QR Code carregado! Escaneie com seu WhatsApp.', 'info');
                
                // Iniciar verificação periódica de status apenas se não estiver rodando
                if (!statusMonitoringInterval) {
                    startStatusMonitoring();
                }
                } catch (qrError) {
                    console.error('Erro ao buscar QR Code:', qrError);
                showNotification('Erro ao carregar QR Code. Tente novamente.', 'error');
        }
        }, 1000);
        
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

    // Resetar para que a próxima verificação de status seja tratada como inicial
    isInitialStatusCheck = true;
    console.log('isInitialStatusCheck resetado para true no início da desconexão.');

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
            // ALTERAÇÃO: Reset do estado da conexão
            resetConnectionState();
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

// NOVA FUNÇÃO: Reset do estado da conexão
function resetConnectionState() {
    userInitiatedConnection = false;
    stopStatusMonitoring();
    console.log('Estado da conexão resetado - userInitiatedConnection:', userInitiatedConnection);
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

// Array para controlar notificações ativas
let activeNotifications = [];

function showNotification(message, type = 'info') {
    // Criar notificação
    const notification = document.createElement('div');
    const notificationId = Date.now() + Math.random(); // ID único
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('data-notification-id', notificationId);
    notification.title = 'Clique para fechar'; // Tooltip
    
    // Calcular posição baseada nas notificações existentes
    const topPosition = 20 + (activeNotifications.length * 70); // 70px de espaçamento entre notificações
    
    notification.style.cssText = `
        position: fixed;
        top: ${topPosition}px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 500;
        max-width: 350px;
        word-wrap: break-word;
    `;
    
    // Event listener para fechar ao clicar
    notification.addEventListener('click', () => {
        removeNotification(notificationId);
    });
    
    // Adicionar à lista de notificações ativas
    activeNotifications.push({
        id: notificationId,
        element: notification,
        topPosition: topPosition
    });
    
    document.body.appendChild(notification);
    
    // Remover notificação após 4 segundos
    setTimeout(() => {
        removeNotification(notificationId);
    }, 4000);
}

// Função para remover notificação e reposicionar as outras
function removeNotification(notificationId) {
    const notificationIndex = activeNotifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) return;
    
    const notification = activeNotifications[notificationIndex];
    
    // Animar saída
    notification.element.style.animation = 'slideOut 0.3s ease';
    
        setTimeout(() => {
        // Remover do DOM
        if (notification.element.parentNode) {
            notification.element.parentNode.removeChild(notification.element);
            }
        
        // Remover da lista
        activeNotifications.splice(notificationIndex, 1);
        
        // Reposicionar notificações restantes
        repositionNotifications();
        }, 300);
}

// Função para reposicionar notificações após remoção
function repositionNotifications() {
    activeNotifications.forEach((notification, index) => {
        const newTopPosition = 20 + (index * 70);
        notification.element.style.top = `${newTopPosition}px`;
        notification.element.style.transition = 'top 0.3s ease';
        notification.topPosition = newTopPosition;
    });
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
    
    /* Estilos para notificações */
    .notification {
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        line-height: 1.4;
        transition: top 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
        cursor: pointer;
        user-select: none;
    }
    
    /* Estilos para animação de conexão */
    .qr-placeholder.connecting {
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        border: 2px dashed #10b981;
        animation: pulse-border 2s infinite;
        padding: 30px 20px;
        border-radius: 12px;
        text-align: center;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        word-wrap: break-word;
        overflow: visible;
    }
    
    .connecting-animation {
        font-size: 2rem;
        color: #10b981;
        margin-bottom: 1rem;
        display: block;
        width: 100%;
        text-align: center;
    }
    
    .qr-placeholder.connecting p {
        margin: 0.5rem 0;
        font-size: 1.1rem;
        color: #374151;
        white-space: nowrap;
        overflow: visible;
        text-overflow: initial;
        width: 100%;
        text-align: center;
    }
    
    .qr-placeholder.connecting .connection-details {
        font-size: 0.9rem;
        color: #6b7280;
        margin-top: 0.5rem;
        white-space: normal;
        word-wrap: break-word;
        line-height: 1.4;
    }
    
    .connecting-dots {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1rem;
    }
    
    .connecting-dots .dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        animation: dot-bounce 1.4s infinite ease-in-out;
    }
    
    .connecting-dots .dot:nth-child(1) { animation-delay: -0.32s; }
    .connecting-dots .dot:nth-child(2) { animation-delay: -0.16s; }
    .connecting-dots .dot:nth-child(3) { animation-delay: 0s; }
    
    @keyframes pulse-border {
        0%, 100% { border-color: #10b981; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        50% { border-color: #059669; box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    }
    
    @keyframes dot-bounce {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1.2); opacity: 1; }
    }
    
    .notification:hover {
        transform: translateX(-5px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
    }
    
    .notification-success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        border-left: 4px solid #065f46;
    }
    
    .notification-error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
        border-left: 4px solid #991b1b;
    }
    
    .notification-warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
        border-left: 4px solid #92400e;
    }
    
    .notification-info {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
        border-left: 4px solid #1d4ed8;
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
        white-space: nowrap;
        overflow: visible;
        text-overflow: initial;
        min-width: fit-content;
        display: inline-flex;
        align-items: center;
        gap: 8px;
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
    
    /* Estilos para tabela de contatos */
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-valid {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-invalid {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .btn-small {
        padding: 6px 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s;
    }
    
    .btn-danger {
        background: #ef4444;
        color: white;
    }
    
    .btn-danger:hover {
        background: #dc2626;
        transform: translateY(-1px);
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

// Função para mostrar modal de importação manual
function showManualImportModal() {
    console.log('Abrindo modal de importação manual...');
    
    // Criar modal se não existir
    let modal = document.getElementById('manualImportModal');
    if (!modal) {
        modal = createManualImportModal();
        
        if (!modal) {
            console.error('Falha ao criar modal!');
            alert('Erro: Não foi possível criar o modal');
            return;
        }
    }
    
    // FORÇAR VISIBILIDADE - sobrescrever qualquer CSS externo
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    modal.style.setProperty('z-index', '999999', 'important');
    
    // Focar no textarea
    const textarea = modal.querySelector('#manualContactsInput');
    if (textarea) {
        // Limpar conteúdo anterior
        textarea.value = '';
        setTimeout(() => textarea.focus(), 100);
    }
}

// Função para criar o modal de importação manual
function createManualImportModal() {
    try {
        const modal = document.createElement('div');
        
        modal.id = 'manualImportModal';
        modal.className = 'modal';
        modal.style.cssText = `
            display: none !important;
            position: fixed !important;
            z-index: 999999 !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: rgba(0,0,0,0.5) !important;
            align-items: center !important;
            justify-content: center !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                position: relative;
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 15px;
                ">
                    <h3 style="margin: 0; color: #1f2937; font-size: 1.25rem;">
                        <i class="fas fa-user-plus"></i> Importar Contatos Manualmente
                    </h3>
                    <button class="close-modal-btn" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        color: #6b7280;
                        cursor: pointer;
                        padding: 5px;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #374151;
                        ">
                            Lista de Contatos:
                        </label>
                        <div style="
                            background: #f3f4f6;
                            border-radius: 8px;
                            padding: 12px;
                            margin-bottom: 12px;
                            font-size: 0.875rem;
                            color: #6b7280;
                        ">
                            <strong>Formatos aceitos:</strong><br>
                            • Uma linha por contato: <code>Nome, Número</code><br>
                            • Separação por vírgula: <code>João Silva, 11999999999</code><br>
                            • Separação por tab: <code>Maria Santos	11888888888</code><br>
                            • Números formatados: <code>55 (11) 99999-9999</code><br>
                            • Com código país: <code>+55 11 99999-9999</code><br>
                            • Só números (um por linha): <code>11777777777</code>
                        </div>
                        <textarea 
                            id="manualContactsInput" 
                            placeholder=""
                            style="
                                width: 100%;
                                height: 200px;
                                padding: 12px;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-family: monospace;
                                font-size: 0.9rem;
                                resize: vertical;
                                outline: none;
                                transition: border-color 0.3s;
                            "
                        ></textarea>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="
                            background: #fef3c7;
                            border: 1px solid #f59e0b;
                            border-radius: 8px;
                            padding: 12px;
                            font-size: 0.875rem;
                            color: #92400e;
                        ">
                            <i class="fas fa-info-circle"></i>
                            <strong>Dica:</strong> Números serão automaticamente validados e formatados. 
                            Contatos duplicados serão ignorados.
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer" style="
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 20px;
                ">
                    <button class="cancel-btn" style="
                        padding: 10px 20px;
                        border: 1px solid #d1d5db;
                        background: white;
                        color: #374151;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        Cancelar
                    </button>
                    <button class="import-contacts-btn" style="
                        padding: 10px 20px;
                        border: none;
                        background: #10b981;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        <i class="fas fa-upload"></i> Importar Contatos
                    </button>
                </div>
            </div>
        `;
        
        // Adicionar eventos
        const closeBtn = modal.querySelector('.close-modal-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const importBtn = modal.querySelector('.import-contacts-btn');
        const textarea = modal.querySelector('#manualContactsInput');
        
        // Fechar modal
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
        });
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Estilo do textarea quando focado
        if (textarea) {
            textarea.addEventListener('focus', () => {
                textarea.style.borderColor = '#10b981';
            });
            
            textarea.addEventListener('blur', () => {
                textarea.style.borderColor = '#e5e7eb';
            });
        }
        
        // Processar importação
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                processManualImport(textarea.value);
                modal.style.display = 'none';
            });
        }
        
        document.body.appendChild(modal);
        
        return modal;
        
    } catch (error) {
        console.error('ERRO ao criar modal:', error);
        alert('Erro ao criar modal: ' + error.message);
        return null;
    }
}

// Função para processar a importação manual
function processManualImport(inputText) {
    if (!inputText.trim()) {
        showNotification('Por favor, insira pelo menos um contato', 'warning');
        return;
    }
    
    const lines = inputText.trim().split('\n');
    const contacts = [];
    const errors = [];
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine) return; // Pular linhas vazias
        
        let name = '';
        let phone = '';
        
        // Tentar diferentes separadores
        if (trimmedLine.includes(',')) {
            // Separação por vírgula
            const parts = trimmedLine.split(',').map(part => part.trim());
            if (parts.length >= 2) {
                name = parts[0];
                phone = parts[1];
            } else {
                phone = parts[0];
            }
        } else if (trimmedLine.includes('\t')) {
            // Separação por tab
            const parts = trimmedLine.split('\t').map(part => part.trim());
            if (parts.length >= 2) {
                name = parts[0];
                phone = parts[1];
            } else {
                phone = parts[0];
            }
        } else if (trimmedLine.includes(' ')) {
            // Separação por espaço (últimos números como telefone)
            const parts = trimmedLine.split(' ');
            const lastPart = parts[parts.length - 1];
            
            // Se a última parte parece um número de telefone
            if (/^\+?[\d\s\-\(\)]+$/.test(lastPart)) {
                phone = lastPart;
                name = parts.slice(0, -1).join(' ').trim();
            } else {
                // Tratar como só número se toda a linha parece um telefone
                if (/^\+?[\d\s\-\(\)]+$/.test(trimmedLine)) {
                    phone = trimmedLine;
                } else {
                    errors.push(`Linha ${lineNumber}: Formato não reconhecido - "${trimmedLine}"`);
                    return;
                }
            }
        } else {
            // Assumir que é só um número de telefone
            phone = trimmedLine;
        }
        
        // Validar e limpar telefone
        const cleanPhone = cleanPhoneNumber(phone);
        if (!cleanPhone || !isValidPhoneNumber(cleanPhone)) {
            errors.push(`Linha ${lineNumber}: Número inválido - "${phone}"`);
            return;
        }
        
        // Se não tem nome, gerar um baseado no número
        if (!name.trim()) {
            name = `Contato ${cleanPhone.slice(-4)}`;
        }
        
        contacts.push({
            name: name.trim(),
            phone: cleanPhone,
            status: 'válido'
        });
    });
    
    // Remover duplicatas
    const uniqueContacts = removeDuplicateContacts(contacts);
    const duplicatesRemoved = contacts.length - uniqueContacts.length;
    
    // Adicionar contatos à tabela
    addContactsToTable(uniqueContacts);
    
    // Mostrar resultados
    let message = `${uniqueContacts.length} contatos importados com sucesso!`;
    if (duplicatesRemoved > 0) {
        message += ` (${duplicatesRemoved} duplicatas removidas)`;
    }
    if (errors.length > 0) {
        message += ` ${errors.length} linhas com erro.`;
    }
    
    showNotification(message, uniqueContacts.length > 0 ? 'success' : 'warning');
    
    // Mostrar erros se houver
    if (errors.length > 0) {
        console.warn('Erros na importação:', errors);
        setTimeout(() => {
            showNotification(`Verifique o console para detalhes dos ${errors.length} erros`, 'info');
        }, 3000);
    }
}

// Função para limpar número de telefone
function cleanPhoneNumber(phone) {
    // Remove tudo exceto números e o sinal de +
    // Inclui remoção de parênteses, hífen, espaços e outros símbolos
    return phone.replace(/[^\d+]/g, '');
}

// Função para validar número de telefone
function isValidPhoneNumber(phone) {
    // Remove o + se existir para validação
    const cleanPhone = phone.replace(/^\+/, '');
    
    // Validar se tem pelo menos 10 dígitos e no máximo 15
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return false;
    }
    
    // Validar se são todos números
    return /^\d+$/.test(cleanPhone);
}

// Função para remover contatos duplicados
function removeDuplicateContacts(contacts) {
    const seen = new Set();
    return contacts.filter(contact => {
        const key = contact.phone;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

// Função para adicionar contatos à tabela
function addContactsToTable(contacts) {
    const tableBody = document.getElementById('contactTableBody');
    if (!tableBody) return;
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.name}</td>
            <td>${formatPhoneNumber(contact.phone)}</td>
            <td><span class="status-badge status-valid">${contact.status}</span></td>
            <td>
                <button class="btn-small btn-danger" onclick="removeContact(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Atualizar estatísticas
    updateContactStatsFromTable();
}

// Função para formatar número de telefone para exibição
function formatPhoneNumber(phone) {
    // Remove o + se existir e retorna apenas os números
    const cleanPhone = phone.replace(/^\+/, '');
    
    // Retornar apenas os números limpos, sem formatação
    return cleanPhone;
}

// Função para remover contato individual
function removeContact(button) {
    const row = button.closest('tr');
    if (row && confirm('Tem certeza que deseja remover este contato?')) {
        row.remove();
        updateContactStatsFromTable();
        showNotification('Contato removido', 'info');
    }
}

// Função para atualizar estatísticas baseado na tabela
function updateContactStatsFromTable() {
    const tableBody = document.getElementById('contactTableBody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    const total = rows.length;
    const valid = Array.from(rows).filter(row => 
        row.querySelector('.status-valid')
    ).length;
    
    updateContactStats(total, valid);
} 