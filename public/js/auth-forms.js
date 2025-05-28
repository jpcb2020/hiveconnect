/* 
 * AUTH-FORMS.JS - JavaScript específico para formulário de LOGIN
 * Usado em: login.ejs
 * Funcionalidades: Validação em tempo real, submissão de formulário, interação com API
 * Dependências: validation.js, auth.js
 */

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    // Validação e submissão do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // Validar campos primeiro
            if (!ValidationUtils.validateLoginForm(email, password)) {
                return;
            }
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Login bem-sucedido, usar o AuthManager para salvar o token
                    AuthManager.saveToken(data.token, rememberMe);
                    
                    // Decodificar o token para verificar o role do usuário
                    try {
                        const base64Url = data.token.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const payload = JSON.parse(window.atob(base64));
                        
                        // Redirecionar baseado no role
                        if (payload.user && payload.user.role === 'admin') {
                            window.location.href = '/admin';
                        } else {
                            window.location.href = '/dashboard';
                        }
                    } catch (e) {
                        console.error('Erro ao decodificar token:', e);
                        // Em caso de erro, redirecionar para dashboard
                        window.location.href = '/dashboard';
                    }
                } else {
                    // Exibir mensagem de erro visual
                    const formElement = document.getElementById('loginForm');
                    formElement.classList.add('shake');
                    
                    // Destacar campo com erro
                    if (data.msg.toLowerCase().includes('credenciais') || data.msg.toLowerCase().includes('email') || data.msg.toLowerCase().includes('senha')) {
                        const emailInput = document.getElementById('email');
                        const passwordInput = document.getElementById('password');
                        emailInput.classList.add('is-invalid');
                        passwordInput.classList.add('is-invalid');
                        
                        document.getElementById('emailFeedback').textContent = data.msg || 'Erro ao fazer login. Verifique suas credenciais.';
                    }
                    
                    // Remove a animação após ela completar
                    setTimeout(() => {
                        formElement.classList.remove('shake');
                    }, 500);
                }
            } catch (err) {
                console.error('Erro:', err);
                // Mostrar mensagem de erro no formulário
                document.getElementById('emailFeedback').textContent = 'Ocorreu um erro ao tentar fazer login. Tente novamente.';
                document.getElementById('email').classList.add('is-invalid');
            }
        });

        // Adicionar validação em tempo real para melhor UX
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');

        if (emailField) {
            emailField.addEventListener('blur', function() {
                if (this.value) {
                    ValidationUtils.validateEmail(this.value) 
                        ? ValidationUtils.clearFieldError('email', 'emailFeedback')
                        : ValidationUtils.showFieldError('email', 'emailFeedback', 'Por favor, insira um email válido.');
                }
            });
        }

        if (passwordField) {
            passwordField.addEventListener('blur', function() {
                if (this.value) {
                    ValidationUtils.validatePassword(this.value)
                        ? ValidationUtils.clearFieldError('password', 'passwordFeedback')
                        : ValidationUtils.showFieldError('password', 'passwordFeedback', 'A senha deve ter pelo menos 6 caracteres.');
                }
            });
        }
    }
}); 