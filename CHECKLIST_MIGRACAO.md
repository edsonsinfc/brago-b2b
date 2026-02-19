# ✅ CHECKLIST DE MIGRAÇÃO HOSTINGER

**Projeto:** Nexus B2B
**Data de Preparação:** 13 de Fevereiro de 2026
**Status:** 🟢 PRONTO PARA MIGRAÇÃO

---

## 📝 FASE 1: PREPARAÇÃO LOCAL (AGORA)

### ✅ Documentação e Configuração
- [x] Guia de migração criado: `MIGRACAO_HOSTINGER.md`
- [x] Template .env criado: `.env.hostinger`
- [x] .gitignore atualizado
- [x] package.json completo com todas as dependências
- [x] ecosystem.config.js configurado

### ✅ Scripts de Automação
- [x] Script de preparação: `scripts/prepare-migration.js`
- [x] Script de backup: `scripts/backup-database.js`
- [x] Script de deploy: `scripts/deploy-hostinger.js`

### 📋 Checklist Técnico
- [ ] **Banco de Dados**
  - [ ] Fazer backup atual: `node scripts/backup-database.js`
  - [ ] Verificar integridade do backup
  - [ ] Armazenar seguramente backups
  
- [ ] **Código**
  - [ ] Verificar `npm install --production` funciona
  - [ ] Testar localmente: `npm start`
  - [ ] Verificar endpoints principais
  
- [ ] **Credenciais**
  - [ ] Listar todas as variáveis de ambiente necessárias
  - [ ] Obter seguramente credenciais Hostinger
  - [ ] Gerar JWT_SECRET novo: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 🖥️ FASE 2: PREPARAÇÃO HOSTINGER

### Informações Necessárias
Obter do painel Hostinger e anotar com segurança:

```
[ ] MySQL Host: _______________________________________________
[ ] MySQL Port: _______________________________________________
[ ] MySQL User: _______________________________________________
[ ] MySQL Password: ____________________________________________
[ ] Database Name: _____________________________________________
[ ] FTP/SFTP Host: _____________________________________________
[ ] FTP/SFTP User: _____________________________________________
[ ] FTP/SFTP Password: _________________________________________
[ ] Diretório Web: _____________________________________________
[ ] Versão Node.js: ____________________________________________
[ ] PM2 disponível: [ ] Sim [ ] Não [ ] Solicitar Suporte
```

### Preparação no Painel
- [ ] Criar banco de dados MySQL
- [ ] Criar usuário MySQL com privilégios completos
- [ ] Habilitar Node.js (se não estiver habilitado)
- [ ] Verificar acesso SSH/SFTP
- [ ] Obter certificado SSL/TLS
- [ ] Configurar domínio e DNS

---

## 📦 FASE 3: FAZER UPLOAD DOS ARQUIVOS

### Opção A: Via Git (Recomendado)
```bash
[ ] Criar repositório público no GitHub/GitLab/Gitea
[ ] Fazer push do código (SEM .env)
[ ] No servidor: git clone seu-repositorio
```

### Opção B: Via SFTP
```bash
[ ] Conectar ao servidor SFTP
[ ] Fazer upload de todos os arquivos (exceto node_modules)
[ ] Verificar permissões de pastas
```

### Arquivo a Fazer Upload
```
Backend (Node.js):
  ✅ src/               (código da aplicação)
  ✅ public/            (arquivos estáticos)
  ✅ scripts/           (scripts de migração)
  ✅ package.json       (dependências)
  ✅ ecosystem.config.js (PM2 config)
  ✅ MIGRACAO_HOSTINGER.md
  ✅ backups/*.sql      (arquivo de backup)
  
Não fazer upload:
  ❌ node_modules/      (instalar no servidor)
  ❌ .env                (criar no servidor)
  ❌ logs/               (será criado no servidor)
  ❌ .git/               (apenas se usar git)
```

---

## 🔧 FASE 4: CONFIGURAÇÃO NO HOSTINGER

### 1. Conectar ao Servidor
```bash
[ ] Abrir terminal/SSH
[ ] ssh seu-usuario@seu-host
[ ] Navegar para diretório da aplicação
```

### 2. Instalar Dependências
```bash
[ ] npm install --production
[ ] npm install -g pm2  (se não estiver)
```

### 3. Criar .env
```bash
[ ] Copiar .env.hostinger para .env
[ ] Editar .env com credenciais Hostinger
[ ] Usar JWT_SECRET gerado
[ ] Salvar arquivo
```

### 4. Banco de Dados
```bash
[ ] Restaurar backup: mysql -u user -p db < backup.sql
[ ] Verificar tabelas: mysql -u user -p db -e "SHOW TABLES;"
```

### 5. Criar Pastas Necessárias
```bash
[ ] mkdir -p logs uploads
[ ] chmod -R 755 logs uploads
[ ] chmod -R 755 public
```

### 6. Iniciar PM2
```bash
[ ] pm2 start ecosystem.config.js
[ ] pm2 save
[ ] pm2 startup
[ ] pm2 logs  (verificar se está rodando)
```

### 7. Configurar Nginx/Reverse Proxy (se necessário)
```bash
[ ] Criar arquivo de config nginx
[ ] Recarregar nginx
[ ] Testar curl localhost:3000
```

---

## ✅ FASE 5: VALIDAÇÃO PÓS-DEPLOY

### Testes Funcionais
```bash
[ ] Health Check: curl https://seu-dominio.com.br/health
[ ] Testar autenticação
[ ] Testar visualização de equipes
[ ] Testar upload de imagens
[ ] Testar envio de emails
[ ] Testar busca de produtos
```

### Verificações de Segurança
```bash
[ ] Verificar se .env está protegido (não acessível via web)
[ ] Testar CORS com domínio correto
[ ] Verificar SSH está desabilitado para público
[ ] Verificar permissões de arquivos
[ ] Validar certificado SSL
```

### Monitoramento
```bash
[ ] Verificar logs: pm2 logs
[ ] Verificar uso de memória: pm2 monit
[ ] Testar restart automático: kill processo
[ ] Verificar espaço em disco: df -h
```

---

## 📊 FASE 6: OTIMIZAÇÕES PÓS-DEPLOY

### Performance
- [ ] Habilitar gzip compression
- [ ] Configurar cache headers
- [ ] Implementar rate limiting
- [ ] Configurar auto-backup do banco

### Monitoramento
- [ ] Configurar alertas de erro
- [ ] Setup de logs centralizados
- [ ] Monitorar performance do banco
- [ ] Configurar uptime monitoring

### Backup e Recuperação
- [ ] Agendar backups diários
- [ ] Testar restauração de backup
- [ ] Documentar procedimento de disaster recovery
- [ ] Criar plano de roolback

---

## 🎯 PHASE 7: PÔES-MIGRAÇÃO

### Comunicação
- [ ] Notificar usuários sobre nova URL
- [ ] Atualizar DNS records
- [ ] Redirecionar domínio antigo (se aplicável)
- [ ] Comunicar tempo de downtime esperado

### Validação Final
- [ ] Teste completo de funcionalidades
- [ ] Validar integração com terceiros
- [ ] Teste de carga
- [ ] Validação de dados

### Documentação
- [ ] Atualizar documentação de deployment
- [ ] Documentar credenciais em local seguro
- [ ] Criar runbook de operações
- [ ] Documentar processo de rollback

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Aplicação não inicia
```bash
Solução:
  pm2 logs
  npm start (teste local)
  Verificar permissões: chmod -R 755 .
```

### Erro de conexão com banco
```bash
Solução:
  Verificar .env: cat .env
  Testar conexão: mysql -h host -u user -p db
  Verificar credenciais Hostinger
```

### Uploads não funcionam
```bash
Solução:
  chmod -R 755 uploads/
  chmod -R 777 uploads/ (menos seguro)
  Verificar espaço: df -h
```

### SSL não funciona
```bash
Solução:
  Verificar certificado: sudo certbot certificates
  Renovar: sudo certbot renew
  Configurar auto-renew: sudo certbot renew --auto
```

---

## 📞 RECURSOS

| Recurso | Link |
|---------|------|
| Hostinger Docs | https://www.hostinger.com.br/passo-a-passo |
| PM2 Documentation | https://pm2.keymetrics.io |
| Node.js Docs | https://nodejs.org/docs |
| Express.js | https://expressjs.com |
| MySQL Docs | https://dev.mysql.com/doc |

---

## 🎓 Próximos Passos Recomendados

1. **Imediatamente:**
   - [ ] Fazer backup do banco de dados
   - [ ] Revisar este checklist
   - [ ] Obter credenciais Hostinger

2. **Ainda hoje:**
   - [ ] Fazer upload dos arquivos
   - [ ] Configurar banco de dados
   - [ ] Testar endpoints principais

3. **Amanhã:**
   - [ ] Executar testes completos
   - [ ] Configurar monitoramento
   - [ ] Documentar procedimentos

---

## ✨ Finalizações

Quando tudo estiver ok:
- [ ] Remover arquivo de teste
- [ ] Executar testes de segurança
- [ ] Validar performance
- [ ] Notificar stakeholders
- [ ] Celebrar! 🎉

---

**Status Atual:** 🟢 PRONTO
**Data de Conclusão:** ___________
**Responsável:** ___________
**Assinatura:** ___________

---

*Este checklist deve ser usado como guia passo-a-passo durante todo o processo de migração.*
