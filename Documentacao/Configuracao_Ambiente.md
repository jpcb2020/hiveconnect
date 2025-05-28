# ⚙️ Configuração de Ambiente - WhatsApp API

## 📋 Variáveis de Ambiente

Para facilitar a troca de configurações da API WhatsApp, o sistema agora usa variáveis de ambiente.

## 🔧 Como configurar

### 1. Copiar o arquivo de exemplo

```bash
cp env.example .env
```

### 2. Editar as configurações no arquivo `.env`

```env
# Configurações da API WhatsApp (HiveWP)
WHATSAPP_API_URL=https://dify-hiveapi.ld9tly.easypanel.host
WHATSAPP_API_KEY=47ec728124b69c04843556078d9033c41ace727c653a6d0072951420d4cdfc17

# Configurações WhatsApp padrão
WHATSAPP_IGNORE_GROUPS=true
```

### 3. Variáveis disponíveis

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `WHATSAPP_API_URL` | URL base da API HiveWP | `https://dify-hiveapi.ld9tly.easypanel.host` |
| `WHATSAPP_API_KEY` | Chave de autenticação da API | `47ec728124b69c04843556078d9033c41ace727c653a6d0072951420d4cdfc17` |
| `WHATSAPP_IGNORE_GROUPS` | Ignorar mensagens de grupos por padrão | `true` |

## 🔄 Como trocar as configurações

### Para usar uma API diferente:

1. **Altere a URL**:
```env
WHATSAPP_API_URL=https://sua-nova-api.com
```

2. **Altere a API Key**:
```env
WHATSAPP_API_KEY=sua_nova_api_key_aqui
```

3. **Reinicie o servidor**:
```bash
npm restart
```

## 🔒 Segurança

### ⚠️ Importante:
- **Nunca commite** o arquivo `.env` no Git
- O arquivo `.env` deve estar no `.gitignore`
- Use o `env.example` apenas como template
- Troque as chaves padrão em produção

### 🛡️ Boas práticas:
- Use API Keys diferentes para desenvolvimento e produção
- Mantenha as chaves em segredo
- Gere novas chaves periodicamente
- Use serviços de gerenciamento de segredos em produção

## 🔧 Configurações adicionais do sistema

O arquivo `env.example` também inclui outras configurações importantes:

```env
# Servidor
PORT=3000

# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=conexbot
DB_USER=seu_usuario_db
DB_PASSWORD=sua_senha_db

# JWT
JWT_SECRET=sua_chave_jwt_secreta
```

## 🚀 Exemplo completo

```env
# Configurações do Servidor
PORT=3000

# API do sistema
API_KEY=minha_chave_super_secreta

# WhatsApp API (Produção)
WHATSAPP_API_URL=https://minha-api-whatsapp.com
WHATSAPP_API_KEY=minha_api_key_producao

# WhatsApp configurações
WHATSAPP_IGNORE_GROUPS=true

# Banco de dados
DB_HOST=meu-servidor-db.com
DB_PORT=5432
DB_NAME=meu_sistema
DB_USER=usuario_producao
DB_PASSWORD=senha_super_secreta

# JWT
JWT_SECRET=minha_chave_jwt_muito_secreta
```

## 📝 Verificação

Para verificar se as configurações estão funcionando:

```bash
# Inicie o servidor
npm start

# Verifique os logs - deve mostrar a URL configurada
tail -f logs/app.log
```

Os logs devem mostrar:
```
[INFO] Configurações WhatsApp carregadas: https://sua-nova-api.com
``` 