require('dotenv').config(); // Carrega as variáveis de ambiente do .env
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('./config/db'); // Inicializa a conexão com o banco de dados

const app = express();

// Define a porta do servidor, usando a variável de ambiente PORT ou 3000 como padrão
const PORT = process.env.PORT || 3000;

// Configurar EJS como mecanismo de visualização
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json({ extended: false })); // Para parsear JSON no corpo das requisições
app.use(express.urlencoded({ extended: true })); // Para parsear dados de formulários
app.use(cookieParser()); // Para gerenciar cookies
app.use(express.static(path.join(__dirname, 'public')));

// Importar middlewares de autenticação
const authPageMiddleware = require('./middleware/authPageMiddleware');
const redirectIfAuthenticatedMiddleware = require('./middleware/redirectIfAuthenticatedMiddleware');

// Rotas públicas - Redirecionamento inteligente da página inicial
app.get('/', (req, res) => {
  // Verificar se existe token de autenticação
  const token = req.cookies && req.cookies.jwtToken;
  
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Redirecionar baseado no role do usuário
      if (decoded.user && decoded.user.role === 'admin') {
        return res.redirect('/admin');
      } else {
        return res.redirect('/dashboard');
      }
    } catch (err) {
      // Token inválido, limpar cookie e mostrar página inicial
      res.clearCookie('jwtToken');
    }
  }
  
  // Se não estiver autenticado, mostrar página inicial
  res.render('index');
});

// Rota para a página de login com verificação se já está logado
app.get('/login', redirectIfAuthenticatedMiddleware, (req, res) => {
  res.render('login');
});



// Rota protegida para o dashboard (requer autenticação)
app.get('/dashboard', authPageMiddleware, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Rota protegida para o painel admin (requer autenticação e role admin)
app.get('/admin', authPageMiddleware, (req, res) => {
  // Verificar se o usuário é admin
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', { 
      message: 'Acesso negado. Apenas administradores podem acessar esta página.',
      error: { status: 403 }
    });
  }
  res.render('admin', { user: req.user });
});

// Rota para logout
app.get('/logout', (req, res) => {
  res.clearCookie('jwtToken');
  res.status(200).json({ message: 'Logout realizado com sucesso' });
});

// Definir Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile')); // Novas rotas de perfil
app.use('/api/admin', require('./routes/admin')); // Rotas administrativas

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // Exporta o app para possíveis testes ou outros usos
