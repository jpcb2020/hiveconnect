# 📱 Integração WhatsApp - Sistema de Disparos

## 🎯 O que foi implementado?

Agora quando você **criar um usuário** no painel administrativo, o sistema automaticamente:

1. ✅ **Cria uma instância do WhatsApp** na HiveWP API
2. ✅ **Gera um QR Code** para autenticação  
3. ✅ **Retorna a URL do QR Code** na resposta
4. ✅ **Registra tudo nos logs** para auditoria

## 🚀 Como usar?

### 1. Criar um novo usuário (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@empresa.com", 
    "password": "senha123",
    "role": "user"
  }'
```

**Resposta esperada:**
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

### 2. Conectar o WhatsApp

1. **Copie a URL do QR Code** da resposta acima
2. **Abra no navegador** ou envie para o usuário
3. **No celular**: WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo
4. **Escaneie o QR Code** exibido na tela

### 3. Verificar status da conexão

```bash
curl -X GET "http://localhost:3000/api/admin/whatsapp/status/joao@empresa.com" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

## 🛠️ Novos Endpoints Disponíveis

### Gerenciamento de Instâncias

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/admin/whatsapp/instances` | GET | Lista todas as instâncias ativas |
| `/api/admin/whatsapp/status/:email` | GET | Status de uma instância específica |
| `/api/admin/whatsapp/create-instance` | POST | Criar instância manualmente |
| `/api/admin/whatsapp/delete-instance` | DELETE | Deletar instância manualmente |

### Exemplos de uso:

#### Listar todas as instâncias:
```bash
curl -X GET http://localhost:3000/api/admin/whatsapp/instances \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

#### Criar instância manual:
```bash
curl -X POST http://localhost:3000/api/admin/whatsapp/create-instance \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "options": {
      "ignoreGroups": true
    }
  }'
```

## 🚀 Como começar a usar?

1. **Inicie o servidor:**
```bash
npm start
```

2. **Faça login como admin** e obtenha o token

3. **Crie um usuário:**
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@empresa.com",
    "password": "senha123",
    "role": "user"
  }'
```

4. **Use a URL do QR Code** retornada na resposta

5. **Monitore o status:**
```bash
curl -X GET "http://localhost:3000/api/admin/whatsapp/status/joao@empresa.com" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📋 Configurações

### ⚙️ Configuração via Variáveis de Ambiente

1. **Copie o arquivo de exemplo:**
```bash
cp env.example .env
```

2. **Edite as configurações WhatsApp no `.env`:**
```env
# Configurações da API WhatsApp (HiveWP)
WHATSAPP_API_URL=https://dify-hiveapi.ld9tly.easypanel.host
WHATSAPP_API_KEY=47ec728124b69c04843556078d9033c41ace727c653a6d0072951420d4cdfc17
WHATSAPP_IGNORE_GROUPS=true
```

3. **Para trocar para sua própria API:**
```env
WHATSAPP_API_URL=https://sua-api-whatsapp.com
WHATSAPP_API_KEY=sua_nova_api_key
```

### Configurações padrão:
- `ignoreGroups`: Definido por `WHATSAPP_IGNORE_GROUPS` (padrão: `true`)
- `clientId`: Email do usuário (sanitizado)

> 📖 **Documentação completa**: Veja `Documentacao/Configuracao_Ambiente.md`

## 🔍 Logs e Monitoramento

Todas as operações são registradas nos logs do sistema:

```
[INFO] Criando instância WhatsApp para o novo usuário: joao@empresa.com
[INFO] Instância WhatsApp criada com sucesso para joao@empresa.com: joao@empresa.com  
[INFO] Admin admin@sistema.com criou novo usuário: João Silva (joao@empresa.com)
```

Para acompanhar em tempo real:
```bash
tail -f logs/app.log  # Se estiver usando arquivo de log
```

## ⚠️ Tratamento de Erros

### Usuário criado, mas WhatsApp falhou:
```json
{
  "msg": "Usuário criado com sucesso, mas houve problema ao configurar WhatsApp",
  "user": { /* dados do usuário */ },
  "whatsapp": {
    "error": "Erro específico da API",
    "status": "Erro na configuração - contate o administrador"
  }
}
```

**Solução**: Use o endpoint manual para recriar a instância:
```bash
curl -X POST http://localhost:3000/api/admin/whatsapp/create-instance \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "email@usuario.com"}'
```

## 🔧 Arquivos Modificados/Criados

### Novos arquivos:
- `utils/whatsappAPI.js` - Utilitários para API WhatsApp
- `Documentacao/WhatsApp_Integration.md` - Documentação detalhada
- `README_WhatsApp.md` - Este arquivo

### Arquivos modificados:
- `controllers/adminController.js` - Integração na criação/remoção de usuários
- `routes/admin.js` - Novos endpoints para gerenciar WhatsApp

## 🚀 Próximos passos sugeridos

1. **Interface web**: Criar tela no frontend para mostrar QR Codes
2. **Dashboard WhatsApp**: Painel para visualizar status de todas as instâncias  
3. **Envio de mensagens**: Interface para enviar mensagens via painel
4. **Webhooks**: Receber e processar mensagens recebidas
5. **Templates**: Sistema de templates de mensagens

## 📞 Suporte

Se houver problemas:

1. **Verifique os logs** do sistema
2. **Teste a conectividade** com a API HiveWP
3. **Execute o script de teste** para diagnóstico
4. **Verifique se a API Key** está válida

### Comandos úteis para debug:

```bash
# Testar conectividade com a API
curl -X GET "https://dify-hiveapi.ld9tly.easypanel.host/api/whatsapp/instances" \
  -H "Authorization: Bearer 47ec728124b69c04843556078d9033c41ace727c653a6d0072951420d4cdfc17"

# Verificar logs do sistema
tail -n 50 logs/app.log

# Listar instâncias ativas
curl -X GET http://localhost:3000/api/admin/whatsapp/instances \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## ✅ Checklist de implementação

- [x] Utilitário para integração com API WhatsApp
- [x] Modificação do controller admin para criação automática
- [x] Modificação do controller admin para remoção automática  
- [x] Novos endpoints para gerenciamento manual
- [x] Rotas configuradas
- [x] Tratamento de erros robusto
- [x] Logs detalhados
- [x] Documentação completa

- [x] README com instruções

**🎉 A integração está completa e pronta para uso!** 