# 🚀 GUIA RÁPIDO - MIGRAÇÃO HOSTINGER

**Tempo estimado:** 30 minutos
**Dificuldade:** Intermediária
**Data:** 13 de Fevereiro de 2026

---

## 📋 O QUE VOCÊ PRECISA

1. **Credenciais Hostinger:**
   - Host MySQL
   - Usuário MySQL
   - Senha MySQL
   - Nome do banco de dados
   - Acesso SSH/SFTP

2. **Ferramentas:**
   - Terminal (PowerShell/CMD no Windows)
   - SFTP client ou acesso SSH
   - Node.js instalado localmente

3. **Arquivos:**
   - Código da aplicação
   - Backup do banco de dados

---

## ⚡ PASSO 1: BACKUP (5 min)

```bash
# Fazer backup do banco de dados atual
node scripts/backup-database.js
```

✅ Arquivo criado em `backups/backup_nexus_*.sql`

---

## ⚡ PASSO 2: PREPARAÇÃO LOCAL (5 min)

```bash
# Verificar preparação
node scripts/prepare-migration.js

# Instalar dependências (se necessário)
npm install
```

✅ Tudo pronto localmente

---

## ⚡ PASSO 3: UPLOAD PARA HOSTINGER (5 min)

### Opção A: Via SFTP (mais fácil)

```bash
# No seu computador:
# 1. Abrir cliente SFTP (WinSCP, FileZilla, etc)
# 2. Conectar com credenciais Hostinger
# 3. Fazer upload de:
#    - src/
#    - public/
#    - scripts/
#    - package.json
#    - ecosystem.config.js
#    - MIGRACAO_HOSTINGER.md
#    - backups/*.sql
```

### Opção B: Via Git (se repositório existir)

```bash
# No servidor Hostinger (via SSH):
git clone seu-repositorio-url seu-dominio
cd seu-dominio
```

✅ Arquivos enviados

---

## ⚡ PASSO 4: CONFIGURAR HOSTINGER (10 min)

### 1. Conectar via SSH

```bash
ssh seu-usuario@seu-host
cd /home/seu-usuario/seu-dominio
```

### 2. Instalar Dependências

```bash
npm install --production
```

### 3. Criar .env

```bash
# Copiar template
cp .env.hostinger .env

# Editar (substituir placeholders)
nano .env
```

**Campos essenciais a alterar:**
```env
MYSQL_HOST=seu-host-mysql.hostinger.com
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha_forte
MYSQL_DATABASE=seu_banco
CORS_ORIGIN=https://seu-dominio.com.br
JWT_SECRET=cole-chave-gerada
```

### 4. Restaurar Banco de Dados

```bash
mysql -h seu-host-mysql \
      -u seu_usuario \
      -p seu_banco < backups/backup_nexus_*.sql
```

Digitar senha quando solicitado.

### 5. Criar Pastas Necessárias

```bash
mkdir -p logs uploads
chmod -R 755 logs uploads public
```

### 6. Iniciar PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ⚡ PASSO 5: VALIDAR (5 min)

### Testar Aplicação

```bash
# Verificar status
pm2 status
pm2 logs

# Testar health
curl http://localhost:3000/health

# Testar acesso via domínio
curl https://seu-dominio.com.br/health
```

### Se Localhost Funcionar mas Domínio Não

- [ ] Verificar Nginx/Apache configurado
- [ ] Verificar certificado SSL
- [ ] Verificar DNS apontando para Hostinger

---

## 🎯 RESULTADO FINAL

✅ Aplicação rodando em `https://seu-dominio.com.br`
✅ Banco de dados sincronizado
✅ PM2 monitorando/auto-restart habilitado
✅ Logs registrando

---

## 🆘 SE ALGO DER ERRADO

### "502 Bad Gateway"
```bash
pm2 logs
pm2 restart b2b-brago
```

### "MySQL Connection Refused"
```bash
# Verificar .env
cat .env

# Testar conexão
mysql -h seu-host -u seu-user -p seu-db -e "SELECT 1;"
```

### "Permission Denied"
```bash
chmod -R 755 logs uploads public
```

### "Port 3000 already in use"
```bash
# Mudar em .env:
PORT=8080  # (ou outro disponível)

# Recarregar nginx
sudo systemctl reload nginx
```

---

## 📱 CHECKLIST FINAL

- [ ] Backup feito localmente
- [ ] Arquivos uploadados
- [ ] .env configurado
- [ ] Banco importado
- [ ] PM2 iniciado
- [ ] Health endpoint respondendo
- [ ] Login funcionando
- [ ] Uploads funcionando

---

## 📞 SUPORTE

**Documentação Completa:** `MIGRACAO_HOSTINGER.md`
**Checklist Detalhado:** `CHECKLIST_MIGRACAO.md`
**Nginx Config:** `nginx-hostinger.conf`

---

## ⏱️ PRÓXIMOS PASSOS

1. ✅ Completar backup
2. ✅ Upload dos arquivos
3. ⏭️ Configurar no Hostinger
4. ⏭️ Validar tudo
5. ⏭️ Apontar DNS para novo servidor

**Tempo Total: ~30 minutos**

---

*Pronto? Vamos lá! 🚀*
