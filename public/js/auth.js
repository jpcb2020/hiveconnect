/* 
 * AUTH.JS - Gerenciador de autenticação GLOBAL
 * Usado em: TODAS as telas (global)
 * Gerencia todos os aspectos da autenticação do lado do cliente:
 * - Armazenamento e recuperação de tokens
 * - Verificação de status de autenticação
 * - Login, logout e verificação de expiração
 */

const AuthManager = {
    // Configurações
    TOKEN_KEY: 'jwtToken',
    
    // Salva token tanto no localStorage quanto em cookie
    saveToken: function(token, rememberMe = false) {
        if (!token) return false;
        
        // Salvar no localStorage
        localStorage.setItem(this.TOKEN_KEY, token);
        
        // Salvar no cookie - 5 horas (18000s) ou 7 dias (604800s) se "lembrar-me"
        const maxAge = rememberMe ? 604800 : 18000;
        document.cookie = `${this.TOKEN_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
        
        return true;
    },
    
    // Obtém o token (primeiro tenta localStorage, depois cookie)
    getToken: function() {
        let token = localStorage.getItem(this.TOKEN_KEY);
        
        // Se não existir no localStorage, tenta recuperar do cookie
        if (!token) {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(this.TOKEN_KEY + '=')) {
                    token = cookie.substring(this.TOKEN_KEY.length + 1);
                    
                    // Sincroniza salvando também no localStorage
                    localStorage.setItem(this.TOKEN_KEY, token);
                    break;
                }
            }
        }
        
        return token;
    },
    
    // Limpa o token de todos os locais de armazenamento
    clearToken: function() {
        // Limpar localStorage
        localStorage.removeItem(this.TOKEN_KEY);
        
        // Limpar cookie definindo expiração no passado
        document.cookie = `${this.TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
    },
    
    // Verifica se o usuário está autenticado
    isAuthenticated: function() {
        return !!this.getToken();
    },
    
    // Logout completo - limpa dados e redireciona
    logout: function() {
        this.clearToken();
        // Usar fetch para limpar o cookie do servidor sem redirecionar
        fetch('/logout', { method: 'GET' })
            .then(() => {
                // Após limpar no servidor, redirecionar para login
                window.location.href = '/login';
            })
            .catch(() => {
                // Se houver erro, redirecionar mesmo assim
                window.location.href = '/login';
            });
    },
    
    // Configura cabeçalhos de autenticação para requisições fetch
    getAuthHeaders: function() {
        const token = this.getToken();
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    },
    
    // Verifica se o token expirou (decodifica sem verificar assinatura)
    isTokenExpired: function() {
        const token = this.getToken();
        if (!token) return true;
        
        try {
            // Decodifica o token (parte central entre os pontos)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            // Verifica a expiração
            const now = Math.floor(Date.now() / 1000);
            return payload.exp < now;
        } catch (e) {
            console.error('Erro ao verificar expiração do token:', e);
            return true; // Se houver erro, considera expirado por segurança
        }
    },
    
    // Redirecionamento inteligente baseado no estado de autenticação
    handleAuthRedirect: function() {
        const token = this.getToken();
        const currentPath = window.location.pathname;
        
        // Verificar se o token está expirado antes de considerar autenticado
        const isAuth = token && !this.isTokenExpired();
        
        // Se o token estiver expirado, limpar tudo
        if (token && this.isTokenExpired()) {
            this.clearToken();
        }
        
        // Se estiver na página de login mas já estiver autenticado (com token válido)
        if (currentPath === '/login' && isAuth) {
            try {
                // Decodificar token para verificar role
                const base64Url = token.split('.')[1];
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
                window.location.href = '/dashboard';
            }
            return;
        }
        
        // Se estiver em página protegida mas não estiver autenticado
        if ((currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin')) && !isAuth) {
            window.location.href = '/login';
            return;
        }
    }
};

// Executar verificação de redirecionamento quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para evitar conflitos com outros scripts
    setTimeout(() => {
        AuthManager.handleAuthRedirect();
    }, 100);
});
