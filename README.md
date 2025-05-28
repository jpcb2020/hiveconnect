# BetBank-organizado

Bem-vindo ao projeto BetBank-organizado! Esta aplicação Express.js é projetada para ser uma base robusta para desenvolvimento web, incluindo front-end, banco de dados PostgreSQL e gerenciamento de imagens.

## Começando: Guia Rápido

Siga estes passos para configurar e executar o projeto localmente.

### 1. Pré-requisitos Essenciais

*   **Node.js**: Versão LTS recomendada (inclui npm).
*   **Git**: Para controle de versão.
*   **PostgreSQL**: Uma instância rodando e acessível.

### 2. Clonar o Repositório

```bash
git clone <url-do-seu-repositorio> # Substitua pela URL do seu repositório
cd BetBank-organizado
```

### 3. Configurar Variáveis de Ambiente (`.env`)

Este projeto usa um arquivo `.env` para gerenciar configurações sensíveis, como as credenciais do banco de dados.

1.  **Crie o arquivo:** Na raiz do projeto (`BetBank-organizado/`), crie um arquivo chamado `.env`.
2.  **Adicione as variáveis:** Cole o seguinte conteúdo no seu `.env`, substituindo os placeholders pelos seus dados reais de conexão do PostgreSQL:

    ```env
    # Configurações do PostgreSQL
    DB_USER=seu_usuario_db
    DB_HOST=seu_host_db
    DB_NAME=seu_nome_db
    DB_PASSWORD=sua_senha_db
    DB_PORT=5432
    ```
    *   `DB_USER`: Usuário do PostgreSQL.
    *   `DB_HOST`: Host do PostgreSQL.
    *   `DB_NAME`: Nome do banco de dados.
    *   `DB_PASSWORD`: Senha do usuário do DB.
    *   `DB_PORT`: Porta do PostgreSQL (padrão: 5432).

    **Importante:** O arquivo `.env` já está listado no `.gitignore`, garantindo que suas credenciais não sejam enviadas para o repositório Git.

### 4. Instalar Dependências

No terminal, na raiz do projeto, execute:

```bash
npm install
```

Este comando instalará todas as dependências necessárias, incluindo:
*   `express`: Framework web principal.
*   `pg`: Driver Node.js para interagir com o PostgreSQL.
*   `dotenv`: Para carregar variáveis de ambiente a partir de um arquivo `.env`.
*   `nodemon`: (DevDependency) Para reiniciar o servidor automaticamente durante o desenvolvimento.

### 5. Executar a Aplicação

*   **Modo de Desenvolvimento (com reinício automático via `nodemon`):**
    ```bash
    npm run dev
    ```
*   **Modo de Produção (ou execução normal):**
    ```bash
    npm start
    ```

A aplicação estará acessível em `http://localhost:3000` (ou na porta definida por `process.env.PORT`).
Ao iniciar, o servidor tentará se conectar ao banco de dados PostgreSQL. Verifique o console para mensagens de status da conexão.

## Entendendo a Estrutura do Projeto

Visão geral da organização das pastas e arquivos principais:

```
BetBank-organizado/
├── config/                 # Configurações da aplicação
│   ├── database.js          # Define parâmetros de conexão do DB (lê do .env)
│   └── db.js                # Gerencia o pool de conexões PostgreSQL e exporta helpers
├── controllers/            # Lógica de controle para as rotas (request handlers)
├── middleware/             # Middlewares customizados do Express
├── models/                 # Definições/modelos de dados (ex: para ORMs como Sequelize, Knex)
├── public/                 # Arquivos estáticos (CSS, JS cliente, imagens)
│   ├── css/
│   ├── js/
│   └── images/
├── routes/                 # Definições das rotas da API e páginas web
├── utils/                  # Funções utilitárias e helpers genéricos
├── views/                  # Templates de front-end (renderizados no servidor, ex: EJS, Pug)
├── .env                       # (Local, NÃO versionado) Armazena variáveis de ambiente
├── .gitattributes             # Configurações de atributos do Git para normalização de arquivos
├── .gitignore                 # Especifica arquivos e pastas intencionalmente não rastreados pelo Git
├── package-lock.json          # Registra as versões exatas das dependências instaladas
├── package.json               # Metadados do projeto, scripts (npm start, dev) e dependências
└── server.js                  # Ponto de entrada principal da aplicação Express
```

### Destaques da Configuração e Fluxo de Conexão com o Banco de Dados

Entenda como a aplicação se conecta ao PostgreSQL:

1.  **`server.js` (Ponto de Entrada Principal):**
    *   No início, `require('dotenv').config();` é chamado para carregar as variáveis definidas no seu arquivo `.env` para o objeto `process.env` do Node.js.
    *   Logo após, `require('./config/db');` é executado. Esta linha importa o módulo `config/db.js`, o que faz com que o código dentro dele seja executado imediatamente.

2.  **`config/db.js` (Gerenciador de Conexão com o Banco):**
    *   Este arquivo importa a configuração de conexão de `config/database.js`.
    *   Utiliza o pacote `pg` para criar um `Pool` de conexões com o PostgreSQL, usando a configuração obtida.
    *   Para verificar a conexão na inicialização, ele executa uma consulta simples (`SELECT NOW()`). O resultado (sucesso ou erro) é logado no console.
    *   Exporta métodos úteis para interagir com o banco de dados (como `query` para executar SQL e `getClient` para transações).

3.  **`config/database.js` (Objeto de Configuração dos Parâmetros de Conexão):**
    *   Este arquivo é responsável por ler as variáveis de ambiente específicas do banco de dados (ex: `process.env.DB_USER`, `process.env.DB_HOST`) que foram carregadas pelo `dotenv`.
    *   Ele também define valores padrão (fallbacks) caso alguma variável de ambiente não seja encontrada (embora, com um `.env` corretamente configurado, os valores do `.env` serão prioritários).
    *   Finalmente, exporta um objeto `dbConfig` que contém todos os parâmetros formatados e prontos para serem usados pelo `pg.Pool` em `config/db.js`.

Este fluxo garante que as credenciais do banco de dados sejam gerenciadas de forma segura através de variáveis de ambiente e que a conexão seja estabelecida e testada assim que a aplicação é iniciada.

## Próximos Passos e Desenvolvimento

Com a estrutura base e a conexão com o banco de dados funcionais, você pode focar em construir as funcionalidades da sua aplicação:

*   **Modelagem de Dados:** Defina os esquemas (schemas) ou modelos (models) para as tabelas do seu banco de dados no diretório `models/`. Considere usar um ORM (como Sequelize ou Knex.js) ou escrever SQL puro.
*   **Desenvolvimento de API/Backend:** Crie as rotas da sua aplicação no diretório `routes/` e implemente a lógica de negócios correspondente nos `controllers/`.
*   **Interface do Usuário (Frontend):** Desenvolva a interface do usuário utilizando arquivos estáticos no diretório `public/` (para HTML, CSS, JavaScript do lado do cliente) ou utilizando motores de template (como EJS, Pug) com arquivos no diretório `views/` se preferir renderização no lado do servidor.

Lembre-se de commitar suas alterações regularmente e de manter suas dependências atualizadas.

Bom desenvolvimento! 💻

## 🔑 Implementando Autenticação no Frontend (Client-Side)

A base de autenticação com JWT está configurada no backend. Aqui está um guia sobre como você pode interagir com ela a partir do seu frontend (ex: em JavaScript usando `fetch` ou uma biblioteca como `axios`):

### 1. Tela de Login

Quando o usuário submeter o formulário de login (com email e senha):

1.  **Envie uma requisição `POST` para `/api/auth/login`:**
    *   **URL:** `http://localhost:3000/api/auth/login` (ou a URL do seu servidor de produção)
    *   **Método:** `POST`
    *   **Cabeçalhos (Headers):**
        *   `Content-Type: application/json`
    *   **Corpo (Body) em formato JSON:**
        ```json
        {
            "email": "email_do_usuario@exemplo.com",
            "password": "senha_do_usuario"
        }
        ```

2.  **Receba e Armazene o Token JWT:**
    *   Se as credenciais forem válidas, o servidor responderá com um JSON contendo o token:
        ```json
        {
            "token": "SEU_TOKEN_JWT_AQUI"
        }
        ```
    *   Você deve armazenar este token de forma segura no cliente. Algumas opções comuns:
        *   **`localStorage`**: O token persiste até ser explicitamente removido. É acessível via JavaScript, o que pode ser uma preocupação de segurança (XSS) se seu site for vulnerável.
            ```javascript
            // Exemplo de como armazenar no localStorage
            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('jwtToken', data.token);
                    // Redirecionar para o painel do usuário ou página protegida
                    // window.location.href = '/painel'; 
                } else {
                    // Tratar erro de login (ex: exibir mensagem)
                    console.error(data.msg || 'Erro no login');
                }
            })
            .catch(err => console.error('Erro na requisição:', err));
            ```
        *   **`sessionStorage`**: Similar ao `localStorage`, mas o token é removido quando a aba/janela do navegador é fechada.
        *   **Cookies (HttpOnly, Secure):** Se estiver usando renderização no lado do servidor ou um framework que facilite, cookies `HttpOnly` são uma opção mais segura contra XSS, pois não são acessíveis via JavaScript do lado do cliente. A configuração para isso é mais complexa com uma API stateless como a que temos.

### 2. Acessando Páginas/Recursos Protegidos

Para qualquer requisição a um endpoint da API que requer autenticação (como `/api/profile/me`):

1.  **Recupere o token JWT** do local onde você o armazenou (ex: `localStorage`).
2.  **Inclua o token no cabeçalho `Authorization`** da sua requisição, usando o esquema `Bearer`.

    ```javascript
    // Exemplo de como fazer uma requisição autenticada
    const token = localStorage.getItem('jwtToken');

    if (token) {
        fetch('/api/profile/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) {
                // Se o status for 401 (Não Autorizado) ou 403 (Proibido),
                // pode significar que o token é inválido ou expirou.
                // Você deve tratar isso, talvez redirecionando para o login.
                if (res.status === 401 || res.status === 403) {
                    console.error('Autorização falhou. Redirecionando para login...');
                    localStorage.removeItem('jwtToken'); // Limpar token inválido
                    // window.location.href = '/login';
                    throw new Error('Não autorizado');
                }
                throw new Error('Erro na resposta da rede');
            }
            return res.json();
        })
        .then(data => {
            console.log('Dados do perfil:', data);
            // Usar os dados do perfil para exibir na página
        })
        .catch(err => {
            console.error('Erro ao buscar perfil:', err);
            // Tratar o erro, talvez exibindo uma mensagem para o usuário
        });
    } else {
        console.log('Nenhum token encontrado. Redirecionando para login.');
        // window.location.href = '/login';
    }
    ```

### 3. Logout do Usuário

Para fazer logout:

1.  **Remova o token JWT** do armazenamento do cliente (ex: `localStorage.removeItem('jwtToken');`).
2.  Redirecione o usuário para a página de login ou página inicial pública.

    ```javascript
    function logout() {
        localStorage.removeItem('jwtToken');
        // window.location.href = '/login';
        console.log('Usuário deslogado.');
    }
    ```
    Como os tokens JWT são stateless (o servidor não armazena o estado do token), a invalidação do lado do servidor é mais complexa. A abordagem comum é simplesmente remover o token do cliente. Para invalidação imediata do lado do servidor, seriam necessárias estratégias como blocklisting de tokens, o que adiciona complexidade.

### 4. Tratamento de Expiração de Token

Os tokens JWT têm um tempo de expiração (configuramos para 1 hora no backend: `{ expiresIn: '1h' }`).

*   Quando o frontend fizer uma requisição com um token expirado, o `authMiddleware` no backend retornará um erro `401 Unauthorized` (com uma mensagem específica de token expirado, se configurado).
*   Seu frontend deve capturar esse erro e:
    1.  Remover o token expirado do armazenamento.
    2.  Redirecionar o usuário para a página de login para que ele possa se autenticar novamente.

Este guia deve fornecer uma boa base para integrar a autenticação no seu frontend! Lembre-se de adaptar os exemplos de código à sua estrutura de frontend e às bibliotecas que estiver utilizando.

## Configuração do Banco de Dados PostgreSQL

Certifique-se de que você tem um servidor PostgreSQL rodando e acessível.

1.  **Crie um Banco de Dados:**
    Se ainda não o fez, crie um banco de dados para a aplicação (ex: `betbank_db`).

2.  **Crie a Tabela de Usuários (`users`):**
    Conecte-se ao seu banco de dados PostgreSQL (usando `psql`, pgAdmin, DBeaver, etc.) e execute o seguinte comando SQL para criar a tabela `users`. Esta tabela armazenará as informações de registro dos usuários:

    ```sql
    CREATE TABLE IF NOT EXISTS conexbot.users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

    **Explicação das Colunas:**
    *   `id SERIAL PRIMARY KEY`: Identificador único auto-incrementável para cada usuário.
    *   `name VARCHAR(255) NOT NULL`: Nome do usuário.
    *   `email VARCHAR(255) NOT NULL UNIQUE`: Email do usuário (deve ser único).
    *   `password VARCHAR(255) NOT NULL`: Para armazenar a senha com hash.
    *   `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`: Data e hora de criação do registro.
    *   `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`: Data e hora da última atualização do registro.

    **Como Executar:**
    *   **Usando `psql` (linha de comando):**
        1.  Conecte-se: `psql -h SEU_HOST -U SEU_USUARIO -d nome_do_banco -p SUA_PORTA`
        2.  Cole o comando `CREATE TABLE` acima e pressione Enter.
        3.  Verifique com `\dt` (listar tabelas) ou `\d users` (descrever tabela).
    *   **Usando pgAdmin ou outra ferramenta gráfica:**
        1.  Conecte-se ao seu servidor e selecione o banco de dados.
        2.  Abra uma "Query Tool" ou console SQL.
        3.  Cole o comando `CREATE TABLE` e execute.

3.  **Configure as Variáveis de Ambiente:**
    Copie o arquivo `.env.example` para `.env` e preencha com suas credenciais do banco de dados PostgreSQL e outras configurações necessárias:
