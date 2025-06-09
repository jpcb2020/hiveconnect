# Documentação do Schema: conexbot

## Visão Geral
Este documento contém todas as informações necessárias para recriar o schema `conexbot` em um novo servidor PostgreSQL.

**Data da documentação**: Gerada automaticamente  
**Objetivo**: Migração de banco de dados

---

## Schema: conexbot

### 1. Criação do Schema

```sql
CREATE SCHEMA IF NOT EXISTS conexbot;
```

---

## Sequências (Sequences)

### 1.1 Sequência: users_id_seq

**Localização**: `conexbot.users_id_seq`

**Configurações**:
- **Tipo de dados**: BIGINT
- **Valor inicial**: 1
- **Valor mínimo**: 1
- **Valor máximo**: 9,223,372,036,854,775,807
- **Incremento**: 1
- **Estado atual**: Último valor = 1, não foi chamada ainda

**Script de criação**:
```sql
CREATE SEQUENCE conexbot.users_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;
```

**Propriedades da sequência**:
- **sequence_name**: users_id_seq
- **sequence_schema**: conexbot
- **data_type**: bigint
- **start_value**: 1
- **minimum_value**: 1
- **maximum_value**: 9223372036854775807
- **increment**: 1
- **last_value**: 1
- **is_called**: false

---

## Tabelas

### 2.1 Tabela: users

**Localização**: `conexbot.users`

**Estrutura da tabela**:

| Coluna | Tipo | Nulo | Padrão | Tamanho Máximo |
|--------|------|------|--------|----------------|
| id | INTEGER | NO | nextval('users_id_seq'::regclass) | - |
| name | VARCHAR | NO | - | 255 |
| email | VARCHAR | NO | - | 255 |
| password | VARCHAR | NO | - | 255 |
| created_at | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | - |
| updated_at | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | - |
| role | VARCHAR | NO | 'user'::character varying | 50 |

**Script de criação**:
```sql
CREATE TABLE conexbot.users (
    id INTEGER NOT NULL DEFAULT nextval('conexbot.users_id_seq'::regclass),
    name CHARACTER VARYING(255) NOT NULL,
    email CHARACTER VARYING(255) NOT NULL,
    password CHARACTER VARYING(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role CHARACTER VARYING(50) NOT NULL DEFAULT 'user'::character varying
);
```

**Chave primária** (assumida baseada no campo id):
```sql
ALTER TABLE conexbot.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
```

**Propriedade da sequência**:
```sql
ALTER SEQUENCE conexbot.users_id_seq OWNED BY conexbot.users.id;
```

---

## Scripts de Migração Completos

### Criação do Schema e Estruturas

```sql
-- Criar o schema
CREATE SCHEMA IF NOT EXISTS conexbot;

-- Criar a sequência
CREATE SEQUENCE conexbot.users_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

-- Criar a tabela users
CREATE TABLE conexbot.users (
    id INTEGER NOT NULL DEFAULT nextval('conexbot.users_id_seq'::regclass),
    name CHARACTER VARYING(255) NOT NULL,
    email CHARACTER VARYING(255) NOT NULL,
    password CHARACTER VARYING(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role CHARACTER VARYING(50) NOT NULL DEFAULT 'user'::character varying
);

-- Adicionar chave primária
ALTER TABLE conexbot.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Vincular a sequência à coluna
ALTER SEQUENCE conexbot.users_id_seq OWNED BY conexbot.users.id;
```

### Verificação Pós-Migração

```sql
-- Verificar se o schema foi criado
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'conexbot';

-- Verificar se a sequência foi criada
SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'conexbot';

-- Verificar se a tabela foi criada
SELECT table_name FROM information_schema.tables WHERE table_schema = 'conexbot';

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'conexbot' AND table_name = 'users'
ORDER BY ordinal_position;
```

---

## Considerações para Migração

### Estado Atual
- **Sequência**: Estado inicial (último valor = 1, não foi chamada)
- **Tabela**: Estrutura criada, provavelmente sem dados

### Pontos de Atenção
1. **Dependências**: A tabela `users` depende da sequência `users_id_seq`
2. **Ordem de criação**: Criar primeiro a sequência, depois a tabela
3. **Permissões**: Verificar se as permissões de acesso ao schema serão mantidas
4. **Backup de dados**: Se houver dados na tabela, fazer backup antes da migração

### Comandos de Backup (se necessário)
```sql
-- Backup da estrutura
pg_dump -h localhost -U username -d database_name -n conexbot --schema-only > conexbot_schema_backup.sql

-- Backup dos dados
pg_dump -h localhost -U username -d database_name -n conexbot --data-only > conexbot_data_backup.sql
```

---

## Histórico de Modificações

| Data | Modificação | Responsável |
|------|-------------|-------------|
| - | Criação inicial da documentação | Sistema |

---

**Nota**: Este documento foi gerado automaticamente baseado na estrutura atual do banco de dados. Sempre verifique a integridade dos dados após a migração. 