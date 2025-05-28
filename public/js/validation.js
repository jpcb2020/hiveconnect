/* 
 * VALIDATION.JS - Utilitários de validação GLOBAIS
 * Usado em: login.ejs (e outras telas com formulários)
 * Dependências: Nenhuma
 */
const ValidationUtils = {
    // Validação de email
    validateEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email && email.trim() && emailRegex.test(email.trim());
    },

    // Validação de senha
    validatePassword: function(password, minLength = 6) {
        return password && password.trim() && password.length >= minLength;
    },

    // Validação de nome
    validateName: function(name) {
        return name && name.trim().length > 0;
    },

    // Função para mostrar feedback de erro
    showFieldError: function(fieldId, feedbackId, message) {
        const field = document.getElementById(fieldId);
        const feedback = document.getElementById(feedbackId);
        
        if (field && feedback) {
            field.classList.add('is-invalid');
            feedback.textContent = message;
        }
    },

    // Função para limpar feedback de erro
    clearFieldError: function(fieldId, feedbackId) {
        const field = document.getElementById(fieldId);
        const feedback = document.getElementById(feedbackId);
        
        if (field && feedback) {
            field.classList.remove('is-invalid');
            feedback.textContent = '';
        }
    },

    // Validação completa do formulário de login
    validateLoginForm: function(email, password) {
        let isValid = true;

        if (!this.validateEmail(email)) {
            this.showFieldError('email', 'emailFeedback', 'Por favor, insira um email válido.');
            isValid = false;
        } else {
            this.clearFieldError('email', 'emailFeedback');
        }

        if (!this.validatePassword(password)) {
            this.showFieldError('password', 'passwordFeedback', 'A senha deve ter pelo menos 6 caracteres.');
            isValid = false;
        } else {
            this.clearFieldError('password', 'passwordFeedback');
        }

        return isValid;
    },


}; 