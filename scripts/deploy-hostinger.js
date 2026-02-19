#!/usr/bin/env node

/**
 * Script de Deploy para Hostinger
 * Automatiza o processo de deployment no servidor Hostinger
 * 
 * Uso: 
 * node scripts/deploy-hostinger.js --host seu-host --user seu-usuario --password sua-senha --db sua-database
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.clear();
  console.log('========================================');
  console.log('🚀 DEPLOY HOSTINGER - GUIA INTERATIVO');
  console.log('========================================\n');

  console.log('Este script irá gerar um arquivo de instruções para deploy no Hostinger.\n');
  
  const host = await prompt('MySQL Host (ex: seu-host.hostinger.com): ');
  const user = await prompt('MySQL User: ');
  const password = await prompt('MySQL Password (será mascarado no log): ');
  const database = await prompt('Database Name: ');
  const domain = await prompt('Seu Domínio (ex: seu-dominio.com.br): ');
  const smtpHost = await prompt('SMTP Host (ex: mail.seu-dominio.com.br): ');
  const smtpUser = await prompt('SMTP User (ex: suporte@seu-dominio.com.br): ');
  const smtpPass = await prompt('SMTP Password: ');

  // Gerar JWT Secret
  const jwtSecret = require('crypto').randomBytes(32).toString('hex');

  // Criar arquivo .env final
  const envContent = `# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Banco de Dados MySQL
MYSQL_HOST=${host}
MYSQL_PORT=3306
MYSQL_USER=${user}
MYSQL_PASSWORD=${password}
MYSQL_DATABASE=${database}

# JWT Secret (GERADO AUTOMATICAMENTE)
JWT_SECRET=${jwtSecret}
BCRYPT_ROUNDS=10

# CORS e URLs
CORS_ORIGIN=https://${domain}
BASE_URL=https://${domain}
FRONTEND_URL=https://${domain}

# Email SMTP
SMTP_HOST=${smtpHost}
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}

# Admin
ADMIN_EMAIL=admin@${domain}
ADMIN_PASSWORD=${await prompt('Admin Password (não será mostrada): ')}
`;

  rl.close();

  // Salvar .env
  fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent);
  console.log('\n✅ Arquivo .env criado com sucesso!');

  // Criar script de deployment
  const deployScript = `#!/bin/bash
# Deploy Script - Hostinger
# Executar no servidor Hostinger via SSH

echo "=========================================="
echo "🚀 INICIANDO DEPLOYMENT - HOSTINGER"
echo "=========================================="

# 1. Atualizar código
echo "📥 Atualizando código..."
git pull origin main
# OU se usar transferência manual
# scp -r ./* seu-usuario@seu-host:/home/seu-usuario/seu-dominio/

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm install --production

# 3. Criar pastas necessárias
echo "📁 Criando pastas necessárias..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups
chmod -R 755 logs
chmod -R 755 uploads

# 4. Importar banco de dados
echo "🗄️  Restaurando banco de dados..."
mysql -h ${host} -u ${user} -p${password} ${database} < backups/backup_latest.sql

# 5. PM2 - Instalar e configurar
echo "🔧 Configurando PM2..."
npm install -g pm2

# 6. Iniciar aplicação
echo "🚀 Iniciando aplicação..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 7. Configurar Nginx (se necessário)
# echo "🌐 Configurando Nginx..."
# sudo cp nginx.conf /etc/nginx/sites-available/seu-dominio.com.br
# sudo ln -s /etc/nginx/sites-available/seu-dominio.com.br /etc/nginx/sites-enabled/
# sudo systemctl restart nginx

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT CONCLUÍDO!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Validar aplicação em https://${domain}"
echo "2. Testar login e funcionalidades"
echo "3. Verificar logs: pm2 logs"
echo "4. Monitorar: pm2 monit"
echo ""
`;

  const deployScriptPath = path.join(__dirname, '..', 'DEPLOY.sh');
  fs.writeFileSync(deployScriptPath, deployScript);
  console.log(`✅ Script de deployment criado: DEPLOY.sh`);

  // Criar arquivo com instruções passo a passo
  const instructions = `# 📋 INSTRUÇÕES DE DEPLOY HOSTINGER

**Data:** ${new Date().toLocaleString('pt-BR')}
**Domínio:** https://${domain}
**Banco de Dados:** ${database}

## ✅ Preparação Local Concluída

Os seguintes arquivos foram gerados:
- ✅ .env (COM CREDENCIAIS - NUNCA FAZER COMMIT)
- ✅ DEPLOY.sh (Script de deployment)

## 🚀 Próximas Etapas no Hostinger

### 1. Conectar ao Servidor via SSH

\`\`\`bash
ssh ${user}@${host}
\`\`\`

### 2. Fazer Upload dos Arquivos

**Opção A: Usando Git**
\`\`\`bash
cd /home/${user}/seu-dominio
git clone seu-repositorio-url
\`\`\`

**Opção B: Usando SFTP**
\`\`\`bash
sftp ${user}@${host}
put -r ./* /home/${user}/seu-dominio/
\`\`\`

### 3. Instalar Dependências

\`\`\`bash
cd /home/${user}/seu-dominio
npm install --production
\`\`\`

### 4. Restaurar Banco de Dados

\`\`\`bash
# Fazer backup dos caracteres anteriormente
mysqldump -h ${host} -u ${user} -p${password} ${database} > backup_antes_restore.sql

# Restaurar do backup local
mysql -h ${host} -u ${user} -p${password} ${database} < backups/backup_nexus.sql
\`\`\`

### 5. Verificar .env

\`\`\`bash
cat .env
# Verificar se todas as credenciais estão corretas
\`\`\`

### 6. Iniciar PM2

\`\`\`bash
npm install -g pm2  # (se já não estiver instalado)
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

### 7. Configurar Reverse Proxy (Nginx)

Se Hostinger usa Nginx, criar arquivo: \`/etc/nginx/sites-available/${domain}\`

\`\`\`nginx
server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};
    
    # Redirect HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain} www.${domain};
    
    # SSL (Hostinger gera automaticamente)
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    
    # Proxy para Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
\`\`\`

Ativar:
\`\`\`bash
sudo ln -s /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

## ✅ Validação Pós-Deploy

\`\`\`bash
# 1. Verificar status PM2
pm2 status
pm2 logs

# 2. Testar endpoint
curl https://${domain}/health

# 3. Verificar espaço em disco
df -h

# 4. Verificar permissões
ls -la logs/
ls -la uploads/

# 5. Monitorar em tempo real
pm2 monit
\`\`\`

## 🔗 Testes Rápidos

**Health Check:**
\`\`\`bash
curl -X GET https://${domain}/health
\`\`\`

**Login Test:**
\`\`\`bash
curl -X POST https://${domain}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@${domain}","password":"sua-senha"}'
\`\`\`

## 🆘 Troubleshooting

### Aplicação não inicia
\`\`\`bash
pm2 logs
npm start  # Teste local
\`\`\`

### Erro de conexão com banco
\`\`\`bash
mysql -h ${host} -u ${user} -p${password} -e "SELECT 1"
\`\`\`

### Uploads não funcionam
\`\`\`bash
chmod -R 755 uploads
chmod -R 755 logs
\`\`\`

### Port 3000 em uso
\`\`\`bash
lsof -i :3000
pm2 kill
service pm2 restart
\`\`\`

## 📞 Contatos Úteis

- **Hostinger Support:** https://www.hostinger.com.br/suporte
- **PM2 Docs:** https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/
- **Node.js Docs:** https://nodejs.org/docs/

---

**⏰ Status:** Pronto para deployment
**🔐 JWT Secret:** \`${jwtSecret}\`
`;

  const instructionsPath = path.join(__dirname, '..', 'INSTRUCOES_HOSTINGER.md');
  fs.writeFileSync(instructionsPath, instructions);
  console.log(`✅ Instruções detalhadas criadas: INSTRUCOES_HOSTINGER.md`);

  console.log('\n========================================');
  console.log('✅ PREPARAÇÃO CONCLUÍDA!');
  console.log('========================================\n');

  console.log('📁 Arquivos Gerados:');
  console.log('  1️⃣  .env (com credenciais Hostinger)');
  console.log('  2️⃣  DEPLOY.sh (script de deployment)');
  console.log('  3️⃣  INSTRUCOES_HOSTINGER.md (guia step-by-step)\n');

  console.log('⚠️  IMPORTANTE:');
  console.log('  • Arquivo .env contém credenciais sensíveis');
  console.log('  • NUNCA fazer commit do .env');
  console.log('  • Guardar cópia segura localmente\n');

  console.log('🚀 Próximo Passo:');
  console.log('  1. Fazer backup do banco de dados atual');
  console.log('  2. Fazer upload dos arquivos para Hostinger');
  console.log('  3. Seguir instruções em INSTRUCOES_HOSTINGER.md\n');
}

main().catch(console.error);
