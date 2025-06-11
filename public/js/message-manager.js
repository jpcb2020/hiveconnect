/**
 * MESSAGE-MANAGER.JS - Gerenciamento de mensagens do usuário
 * 
 * Este módulo contém funções para carregar e salvar mensagens
 * do usuário no banco de dados, utilizando a API do backend.
 */

// Objeto global MessageManager
const MessageManager = {
    // Inicializa as funcionalidades de mensagens
    init: function() {
        console.log('Inicializando MessageManager...');
        
        // Carregar mensagem salva do usuário quando a página carregar
        this.loadUserMessage();
        
        // Configurar o botão de salvar mensagem
        const saveMessageBtn = document.getElementById('saveMessageBtn');
        if (saveMessageBtn) {
            saveMessageBtn.addEventListener('click', () => this.saveUserMessage());
        }
        
        // Opcionalmente, configurar autosave quando o usuário digitar
        const messageContent = document.getElementById('messageContent');
        if (messageContent) {
            // Debounce para não enviar muitas requisições
            let typingTimer;
            messageContent.addEventListener('input', () => {
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    // Auto-save depois de 2 segundos de inatividade
                    this.saveUserMessage(true); // true indica autosave
                }, 2000);
            });
        }
        
        // Configurar fechamento do modal de sucesso
        const closeModalButtons = document.querySelectorAll('.close-save-modal');
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => MessageManager.closeSaveSuccessModal());
        });
        
        // Fechar modal quando clicar fora
        const saveSuccessModal = document.getElementById('saveSuccessModal');
        if (saveSuccessModal) {
            saveSuccessModal.addEventListener('click', (e) => {
                if (e.target === saveSuccessModal) {
                    MessageManager.closeSaveSuccessModal();
                }
            });
        }
    },
    
    // Carrega a mensagem salva do usuário
    loadUserMessage: async function() {
        try {
            const messageContent = document.getElementById('messageContent');
            if (!messageContent) {
                console.error('Elemento messageContent não encontrado!');
                return;
            }
            
            const response = await authenticatedFetch('/api/profile/message');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.mensagem !== null) {
                    messageContent.value = data.mensagem;
                    console.log('Mensagem carregada com sucesso');
                }
            } else {
                console.error('Erro ao carregar mensagem:', response.status);
            }
        } catch (error) {
            console.error('Erro ao carregar mensagem do usuário:', error);
        }
    },
    
    // Salva a mensagem do usuário
    saveUserMessage: async function(isAutoSave = false) {
        try {
            const messageContent = document.getElementById('messageContent');
            if (!messageContent) {
                console.error('Elemento messageContent não encontrado!');
                return;
            }
            
            const mensagem = messageContent.value.trim();
            
            const response = await authenticatedFetch('/api/profile/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mensagem })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    if (!isAutoSave) {
                        // Mostrar modal de sucesso
                        MessageManager.showSaveSuccessModal();
                    }
                    console.log('Mensagem salva com sucesso');
                }
            } else {
                console.error('Erro ao salvar mensagem:', response.status);
                showNotification('Erro ao salvar mensagem', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar mensagem do usuário:', error);
            showNotification('Erro ao salvar mensagem: ' + error.message, 'error');
        }
    },
    
    // Exibe o modal de sucesso (método estático)
    showSaveSuccessModal: function() {
        console.log('Exibindo modal de sucesso...');
        const modal = document.getElementById('saveSuccessModal');
        if (modal) {
            modal.classList.add('active');
            
            // Fechar automaticamente após 3 segundos
            setTimeout(() => {
                MessageManager.closeSaveSuccessModal();
            }, 3000);
        } else {
            console.error('Modal de sucesso não encontrado!');
        }
    },
    
    // Fecha o modal de sucesso (método estático)
    closeSaveSuccessModal: function() {
        const modal = document.getElementById('saveSuccessModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
};

// Inicializar o gerenciador quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    MessageManager.init();
}); 