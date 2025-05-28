# 🐝 Integração WhatsApp - Painel Admin

## Visão Geral

O sistema agora integra automaticamente com a HiveWP API do WhatsApp quando usuários são criados ou removidos no painel administrativo. Cada usuário recebe automaticamente uma instância própria do WhatsApp.

## 🚀 Funcionalidades Implementadas

### ✅ Criação Automática de Instância

Quando um **novo usuário é criado** no painel admin:

1. 👤 **Usuário é criado** no banco de dados
2. 📱 **Instância WhatsApp é automaticamente criada** usando o email como `clientId`
3. 🔗 **QR Code é gerado** para autenticação
4. 📊 **Status é retornado** na resposta da API

### ✅ Remoção Automática de Instância

Quando um **usuário é deletado** no painel admin:

1. 🗑️ **Usuário é removido** do banco de dados
2. 📱 **Instância WhatsApp é automaticamente deletada** da API
3. 🧹 **Limpeza automática** dos dados de sessão

## 📝 Endpoints Criados

### Gerenciamento de Usuários (Modificados)

#### `POST /api/admin/users` - Criar Usuário
**Modificado para incluir criação automática de instância WhatsApp**

```http
POST /api/admin/users
Authorization: Bearer seu_token_admin
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "password": "senha123",
  "role": "user"
}
```

**Resposta de Sucesso:**
```json
{
  "msg": "Usuário criado com sucesso e instância WhatsApp configurada",
  "user": {
    "id": 5,
    "name": "João Silva",
    "email": "joao@empresa.com",
    "role": "user",
    "created_at": "2025-01-08T15:30:00.000Z"
  },
  "whatsapp": {
    "clientId": "joao@empresa.com",
    "qrCodeUrl": "https://dify-hiveapi.ld9tly.easypanel.host/api/whatsapp/qr-image?clientId=joao@empresa.com",
    "status": "Aguardando conexão - escaneie o QR Code"
  }
}
```

#### `DELETE /api/admin/users/:id` - Deletar Usuário
**Modificado para incluir remoção automática de instância WhatsApp**

### Novos Endpoints - Gerenciamento WhatsApp

#### `GET /api/admin/whatsapp/instances` - Listar Instâncias
Lista todas as instâncias WhatsApp ativas na API

```http
GET /api/admin/whatsapp/instances
Authorization: Bearer seu_token_admin
```

#### `GET /api/admin/whatsapp/status/:email` - Status da Instância
Verifica o status de conexão de um usuário específico

```http
GET /api/admin/whatsapp/status/joao@empresa.com
Authorization: Bearer seu_token_admin
```

#### `POST /api/admin/whatsapp/create-instance` - Criar Instância Manual
Cria manualmente uma instância para um usuário existente

```http
POST /api/admin/whatsapp/create-instance
Authorization: Bearer seu_token_admin
Content-Type: application/json

{
  "email": "joao@empresa.com",
  "options": {
    "ignoreGroups": true,
    "webhookUrl": "https://seu-webhook.com/endpoint"
  }
}
```

#### `DELETE /api/admin/whatsapp/delete-instance` - Deletar Instância Manual
Remove manualmente uma instância de um usuário

```http
DELETE /api/admin/whatsapp/delete-instance
Authorization: Bearer seu_token_admin
Content-Type: application/json

{
  "email": "joao@empresa.com"
}
```

## ⚙️ Configurações da API

As configurações da HiveWP API estão no arquivo `utils/whatsappAPI.js`:

```javascript
const WHATSAPP_API_CONFIG = {
    baseURL: 'https://dify-hiveapi.ld9tly.easypanel.host',
    apiKey: '47ec728124b69c04843556078d9033c41ace727c653a6d0072951420d4cdfc17'
};
```

## 🔄 Fluxo de Trabalho

### Para Administradores:

1. **Criar Usuário**:
   - Use o endpoint `POST /api/admin/users`
   - A instância WhatsApp será criada automaticamente
   - Forneça a URL do QR Code para o usuário

2. **Monitorar Instâncias**:
   - Use `GET /api/admin/whatsapp/instances` para ver todas as instâncias
   - Use `GET /api/admin/whatsapp/status/:email` para verificar status específico

3. **Gerenciar Problemas**:
   - Se uma instância falhou, use `POST /api/admin/whatsapp/create-instance` para recriar
   - Se necessário, use `DELETE /api/admin/whatsapp/delete-instance` para remover

### Para Usuários:

1. **Após criação da conta**:
   - Receber a URL do QR Code do administrador
   - Abrir WhatsApp no celular → Menu → Dispositivos conectados → Conectar dispositivo
   - Escanear o QR Code fornecido

2. **Uso do sistema**:
   - Uma vez conectado, o usuário pode usar todas as funcionalidades do WhatsApp através da API

## 🐛 Tratamento de Erros

### Criação de Usuário com Falha no WhatsApp

Se a criação do usuário foi bem-sucedida, mas a instância do WhatsApp falhou:

```json
{
  "msg": "Usuário criado com sucesso, mas houve problema ao configurar WhatsApp",
  "user": { /* dados do usuário */ },
  "whatsapp": {
    "error": "Mensagem de erro específica",
    "status": "Erro na configuração - contate o administrador"
  }
}
```

**Ação recomendada**: Use o endpoint manual `POST /api/admin/whatsapp/create-instance` para tentar novamente.

## 🔧 Utilitários Disponíveis

O arquivo `utils/whatsappAPI.js` exporta as seguintes funções:

- `createWhatsAppInstance(userEmail, options)` - Criar instância
- `deleteWhatsAppInstance(userEmail)` - Deletar instância  
- `getWhatsAppInstanceStatus(userEmail)` - Verificar status
- `listAllWhatsAppInstances()` - Listar todas as instâncias
- `sendTextMessage(userEmail, phoneNumber, message, options)` - Enviar mensagem
- `callHiveWPAPI(endpoint, method, data)` - Função genérica para API

## 📋 Logs e Monitoramento

Todas as operações são registradas no sistema de logs:

```
[INFO] Criando instância WhatsApp para o novo usuário: joao@empresa.com
[INFO] Instância WhatsApp criada com sucesso para joao@empresa.com: joao@empresa.com
[INFO] Admin admin@sistema.com criou novo usuário: João Silva (joao@empresa.com)
```

## 🔐 Segurança

- ✅ Todos os endpoints requerem autenticação admin
- ✅ API Key da HiveWP está protegida no servidor
- ✅ Logs detalhados para auditoria
- ✅ Validações de entrada em todos os endpoints
- ✅ Tratamento de erros robusto

## 🚀 Próximos Passos

Para expandir a funcionalidade, considere:

1. **Interface Web**: Criar páginas no frontend para gerenciar instâncias WhatsApp
2. **Webhooks**: Implementar recebimento de mensagens via webhook
3. **Templates**: Criar sistema de templates de mensagens
4. **Relatórios**: Dashboard com estatísticas de uso do WhatsApp
5. **Bulk Actions**: Envio de mensagens em massa 