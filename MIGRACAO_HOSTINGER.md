# Guia de Migração para Hostinger

**Status:** Preparado para migração
**Data de Preparação:** 13 de Fevereiro de 2026
**Versão do Projeto:** 0.1.0 (Nexus B2B)

---

## 📋 Resumo da Aplicação

- **Framework:** Node.js + Express
- **Banco de Dados:** MySQL
- **Servidor:** PM2 (ecosystem.config.js)
- **Porta Padrão:** 3000
- **Tipo:** Sistema B2B - Gestão de Equipes, Pedidos e Produtos

---

## ✅ Checklist de Migração

### 1. Preparação Remota - Hostinger

- [ ] Criar conta/acesso no Hostinger
- [ ] Acessar painel de controle Hostinger
- [ ] Criar banco de dados MySQL
- [ ] Criar usuário MySQL com privilégios
- [ ] Anotar credenciais do banco de dados
- [ ] Verificar versão de Node.js disponível (mínimo v18)
- [ ] Solicitar suporte para habilitar Node.js se necessário
- [ ] Obter acesso SSH/SFTP ao servidor

### 2. Configuração de Domínio

- [ ] Apontar registros DNS para Hostinger
- [ ] Configurar SSL/TLS (geralmente automático)
- [ ] Testar resolução do domínio

### 3. Preparação Local - Antes de Enviar

- [x] Código verificado e testado
- [x] Dependências do package.json listadas
- [x] Arquivo .env.example preparado
- [ ] Backup do banco de dados atual criado
- [ ] Variáveis de ambiente sensíveis removidas do git
- [ ] Arquivo .gitignore atualizado

### 4. Deploy no Hostinger

- [ ] Fazer upload dos arquivos via SFTP ou Git
- [ ] Instalar dependências (npm install --production)
- [ ] Criar .env com credenciais do Hostinger
- [ ] Executar migrações do banco de dados se necessário
- [ ] Iniciar aplicação com PM2 ou supervisord

### 5. Validação Pós-Deploy

- [ ] Testar conexão com banco de dados
- [ ] Verificar health endpoint (/health)
- [ ] Testar login de usuário
- [ ] Validar envio de emails (SMTP)
- [ ] Testar upload de arquivos
- [ ] Verificar permissões de pastas (uploads, logs)

---

## 📦 Gerenciamento de Dependências

### Instalar Dependências

```bash
npm install --production
```

### Dependências Principais
- **express:** Framework web
- **mysql2:** Cliente MySQL
- **bcryptjs:** Hash de senhas
- **jsonwebtoken:** Autenticação JWT
- **nodemailer:** Envio de emails
- **multer:** Upload de arquivos
- **cors:** CORS middleware

### Dependências Opcionais
- **oracledb:** Integração ERP (pode ser removida se não usar)

---

## 🔐 Variáveis de Ambiente - Hostinger

Criar arquivo `.env` no diretório raiz com:

```bash
# Servidor
PORT=3000
NODE_ENV=production

# MySQL (credenciais Hostinger)
MYSQL_HOST=seu-host-mysql.hostinger.com
MYSQL_PORT=3306
MYSQL_USER=seu_usuario_mysql
MYSQL_PASSWORD=sua_senha_mysql_forte
MYSQL_DATABASE=seu_banco_dados

# Segurança
JWT_SECRET=gerar-chave-aleatoria-forte-32-caracteres-minimo
BCRYPT_ROUNDS=10

# CORS e URLs
CORS_ORIGIN=https://seu-dominio.com.br
BASE_URL=https://seu-dominio.com.br
FRONTEND_URL=https://seu-dominio.com.br

# Email (SMTP)
SMTP_HOST=seu-servidor-smtp.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@seu-dominio.com.br
SMTP_PASS=sua_senha_email

# Admin (ajustar conforme necessário)
ADMIN_EMAIL=admin@seu-dominio.com.br
ADMIN_PASSWORD=senha-forte-aqui
```

---

## 🗄️ Banco de Dados

### Backup Atual

```bash
# Windows - via PowerShell
mysqldump -h localhost -u root -p nexus_b2b > backup_nexus_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

### Restauração no Hostinger

```bash
# Via SSH no Hostinger
mysql -h seu-host-mysql -u seu_usuario -p seu_banco < backup_nexus.sql
```

---

## 🚀 Deployment com PM2

### Arquivo ecosystem.config.js

Já está configurado e deve funcionar em qualquer servidor Node.js:

```javascript
module.exports = {
  apps: [{
    name: 'b2b-brago',
    script: './src/server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### Iniciar PM2 no Hostinger

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 Configuração de Reverse Proxy

### Se Hostinger não suporta Node.js nativo

Usar Nginx como reverse proxy:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📁 Estrutura de Pastas Necessárias

Garantir que existem no servidor Hostinger:

```
/home/seu_usuario/seu-dominio/
├── src/
├── public/
├── uploads/          (permissões 755)
├── logs/             (permissões 755)
├── scripts/
├── package.json
├── ecosystem.config.js
├── .env              (não fazer commit)
└── .gitignore
```

---

## 🔗 Endpoints para Validação

Após deploy, testar:

```bash
# Health check
curl https://seu-dominio.com.br/health

# Login (POST)
curl -X POST https://seu-dominio.com.br/api/auth/login

# Outros endpoints disponíveis:
# - /api/equipes
# - /api/pedidos
# - /api/produtos
# - /api/usuarios
# - /api/upload
# - /api/orcamentos
```

---

## 📧 Configuração de Email

### Se usar Hostinger Mail

```env
SMTP_HOST=mail.seu-dominio.com.br
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=suporte@seu-dominio.com.br
SMTP_PASS=seu_password
```

### Se usar Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

### Se usar Zoho (atual)

```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@seu-dominio.com.br
SMTP_PASS=sua_senha_zoho
```

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] JWT_SECRET alterado (mínimo 32 caracteres)
- [ ] ADMIN_PASSWORD alterada
- [ ] MYSQL_PASSWORD forte (caracteres especiais)
- [ ] .env ou credenciais sensíveis não estão em git
- [ ] CORS_ORIGIN apontando para domínio correto
- [ ] SSL/TLS habilitado
- [ ] Headers de segurança configurados
- [ ] Rate limiting habilitado em produção

### Gerar JWT_SECRET Seguro

```bash
# No Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Monitoramento

### Logs

Os logs são salvos em:
- `logs/error.log` - erros da aplicação
- `logs/out.log` - output da aplicação
- `logs/combined.log` - todos os logs

### Com PM2

```bash
# Monitor em tempo real
pm2 monit

# Ver logs
pm2 logs

# Limpar logs
pm2 flush
```

---

## 🚨 Troubleshooting Comum

### Erro: "Cannot find module"

```bash
npm install
npm install --production
```

### Erro: "Connection refused" (Banco de dados)

- Verificar credenciais .env
- Verificar status do MySQL no Hostinger
- Verificar firewall/IP whitelist

### Erro: "Permission denied" (Uploads)

```bash
chmod -R 755 uploads/
chmod -R 755 logs/
```

### Porta 3000 em uso

```bash
# Mudar PORT em .env ou ecosystem.config.js
# Hostinger pode usar 8080, 8000, etc
```

### Aplicação não inicia

```bash
# Verificar erros
pm2 logs
pm2 show b2b-brago

# Restartar
pm2 restart b2b-brago
pm2 reload b2b-brago
```

---

## 📞 Contato Hostinger Support

Para questões específicas:
- Documentação: https://www.hostinger.com.br/passo-a-passo
- Chat: Painel de controle Hostinger > Chat de suporte
- Email: support@hostinger.com.br

---

## ✨ Próximos Passos

1. **Backup do BD atual:**
   ```bash
   npm run BACKUP_SCRIPT_LOCAL
   ```

2. **Registrar credenciais Hostinger:**
   - Host MySQL
   - Usuário MySQL
   - Senha MySQL
   - Banco de dados
   - Credenciais FTP/SSH

3. **Preparar arquivo .env** conforme template em `.env.example`

4. **Fazer upload dos arquivos** via Git ou SFTP

5. **Executar npm install** no servidor Hostinger

6. **Importar banco de dados** do backup

7. **Iniciar PM2** com ecosystem.config.js

8. **Validar endpoints** e funcionalidades

---

**Documento preparado por:** GitHub Copilot
**Data:** 13 de Fevereiro de 2026
**Status:** ✅ Pronto para Migração
