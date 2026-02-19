# 📋 COMANDOS RÁPIDOS - MIGRAÇÃO HOSTINGER

**Data:** 13 de Fevereiro de 2026
**Referência Rápida:** Copiar e colar

---

## 🏠 Localmente (Seu computador)

### Backup
```bash
npm run backup
```
Cria arquivo em: `backups/backup_nexus_[timestamp].sql`

### Verificar Preparação
```bash
npm run prepare-migration
```
Mostra relatório de status

### Gerar Deploy
```bash
npm run deploy
```
Assistente interativo para criar .env

### Testar Localmente
```bash
npm install
npm start
```
Verificar em: http://localhost:3000

### Fazer Backup com PowerShell (Windows)
```powershell
.\backup-database.ps1
```

---

## 🖥️  No Servidor Hostinger

### Conectar via SSH
```bash
ssh seu-usuario@seu-host
cd /home/seu-usuario/seu-dominio
```

### Instalar Dependências
```bash
npm install --production
```

### Criar .env
```bash
cp .env.hostinger .env
nano .env  # Editar com credenciais
```

### Restaurar Banco de Dados
```bash
mysql -h seu-host-mysql -u seu_usuario -p seu_banco < backup.sql
```
Digitar password quando solicitado

### Criar Pastas Necessárias
```bash
mkdir -p logs uploads
chmod -R 755 logs uploads public
```

### Instalar PM2 Globalmente
```bash
npm install -g pm2
```

### Iniciar Aplicação
```bash
pm2 start ecosystem.config.js
```

### Salvar Configuração PM2
```bash
pm2 save
pm2 startup
```

### Verificar Status
```bash
pm2 status
pm2 logs
pm2 monit
```

### Recarregar Nginx
```bash
sudo systemctl reload nginx
sudo systemctl restart nginx
```

### Testar Health
```bash
curl http://localhost:3000/health
curl https://seu-dominio.com.br/health
```

---

## 🔧 Troubleshooting Rápido

### PM2 não inicia?
```bash
pm2 logs              # Ver erros
npm start             # Testar manualmente
pm2 kill              # Resetar PM2
pm2 start ecosystem.config.js
```

### Banco de dados recusando?
```bash
mysql -h seu-host -u seu-user -p -e "SELECT 1;"  # Testar conexão
cat .env | grep MYSQL                             # Verificar config
```

### Permissões de upload?
```bash
chmod -R 755 uploads
chmod -R 755 logs
ls -la uploads/  # Verificar
```

### Nginx error?
```bash
sudo nginx -t              # Testar configuração
sudo systemctl reload nginx
tail -f /var/log/nginx/error.log  # Ver erros
```

### Port em uso?
```bash
lsof -i :3000           # Quem está usando
netstat -tlnp | grep 3000
pm2 kill                # Liberar
```

---

## 📊 Monitoramento

### Ver logs em tempo real
```bash
pm2 logs
pm2 logs [n]            # Linha n
pm2 logs --lines 100    # Últimas 100 linhas
```

### Monitorar processo
```bash
pm2 monit
```

### Restart gracioso
```bash
pm2 gracefulReload b2b-brago
```

### Flush logs
```bash
pm2 flush
```

### Ver detalhes do processo
```bash
pm2 show b2b-brago
```

---

## 📦 MySQL Rápido

### Conectar
```bash
mysql -h seu-host -u seu-user -p seu-banco
```

### Ver tabelas
```bash
SHOW TABLES;
```

### Ver status
```bash
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM equipes;
SELECT COUNT(*) FROM pedidos;
```

### Fazer backup
```bash
mysqldump -h host -u user -p banco > backup.sql
```

### Restaurar
```bash
mysql -h host -u user -p banco < backup.sql
```

### Sair
```bash
EXIT;
```

---

## 🌐 Nginx Rápido

### Ver status
```bash
sudo systemctl status nginx
```

### Iniciar
```bash
sudo systemctl start nginx
```

### Parar
```bash
sudo systemctl stop nginx
```

### Recarregar (sem downtime)
```bash
sudo systemctl reload nginx
```

### Restartar
```bash
sudo systemctl restart nginx
```

### Ver config
```bash
sudo cat /etc/nginx/sites-enabled/seu-dominio
```

### Testar config
```bash
sudo nginx -t
```

### Ver logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 📝 Variáveis de Ambiente

### Ver todas
```bash
cat .env
env | grep MYSQL
env | grep NODE
```

### Editando
```bash
nano .env
# ou
vi .env
```

### Recarregar após editar
```bash
pm2 restart b2b-brago
```

---

## 🧪 Testes de API

### Health Check
```bash
curl https://seu-dominio.com.br/health
```

### Login
```bash
curl -X POST https://seu-dominio.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@seu-dominio.com.br","password":"sua-senha"}'
```

### Listar Equipes
```bash
curl -X GET https://seu-dominio.com.br/api/equipes \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Listar Produtos
```bash
curl -X GET https://seu-dominio.com.br/api/produtos
```

---

## 💾 Backup e Recuperação

### Backup Automático
```bash
npm run backup
```

### Backup Manual MySQL
```bash
mysqldump -h host -u user -p banco > backup_manual.sql
```

### Restaurar de Backup
```bash
mysql -h host -u user -p banco < backup.sql
```

### Listar Backups
```bash
ls -lh backups/
```

### Transferir Backup (SFTP)
```bash
scp backups/backup_*.sql usuario@host:/home/usuario/seu-dominio/
```

---

## 🔒 Segurança Rápida

### Gerar JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Gerar senha
```bash
openssl rand -base64 32
```

### Verificar certificado SSL
```bash
sudo certbot certificates
```

### Renovar certificado
```bash
sudo certbot renew
```

### Ver headers HTTP
```bash
curl -I https://seu-dominio.com.br
```

---

## 📂 Arquivos Importantes

### Arquivo de config Node.js
```bash
ecosystem.config.js
```

### Arquivo de variáveis
```bash
.env
```

### Arquivo de configuração Nginx
```bash
/etc/nginx/sites-available/seu-dominio
```

### Logs Node.js
```bash
logs/error.log
logs/out.log
logs/combined.log
```

### Logs Nginx
```bash
/var/log/nginx/access.log
/var/log/nginx/error.log
```

---

## ⚡ Atalhos Úteis

### Conectar + Acessar app
```bash
ssh usuario@host && cd /home/usuario/seu-dominio && pm2 logs
```

### Ver status + logs
```bash
pm2 status && pm2 logs --lines 20
```

### Backup + Status
```bash
npm run backup && echo "✅ Backup OK"
```

### Restart + Verificar
```bash
pm2 restart b2b-brago && sleep 2 && curl http://localhost:3000/health
```

---

## 📞 Verificação de Saúde (Health Check)

### Todos os endpoints
```bash
# Health
curl https://seu-dominio.com.br/health

# Login (teste)
curl -X POST https://seu-dominio.com.br/api/auth/login \
  -d '{"email":"test@test.com","password":"test"}'

# Equipes
curl https://seu-dominio.com.br/api/equipes

# Produtos
curl https://seu-dominio.com.br/api/produtos

# Usuários
curl https://seu-dominio.com.br/api/usuarios
```

---

## 🎯 Checklist Pré-Deploy

```bash
# 1. Backup
npm run backup

# 2. Verificar
npm run prepare-migration

# 3. Testar local
npm install
npm start

# 4. Em outro terminal, testar
curl http://localhost:3000/health

# 5. Pronto!
```

---

## 📝 NOTAS

- Substituir `seu-usuario`, `seu-host`, `seu-dominio.com.br` pelos valores reais
- Ajustar portas se necessário (padrão 3000)
- PM2 auto-restart habilitado
- Logs salvos em `/home/usuario/seu-dominio/logs/`
- Backup automático disponível

---

**Documento:** Comandos Rápidos - Migração Hostinger
**Data:** 13 de Fevereiro de 2026
**Status:** ✅ Pronto para usar
