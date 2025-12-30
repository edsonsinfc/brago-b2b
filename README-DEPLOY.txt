# DEPLOY - B2B BRAGO DISTRIBUIDORA

Data de preparacao: 24/11/2025 16:08

## ARQUIVOS INCLUIDOS

- public/ (HTML, CSS, JS, imagens)
- src/ (codigo fonte Node.js)
- scripts/ (scripts SQL e utilitarios)
- package.json (dependencias)
- ecosystem.config.js (configuracao PM2)
- .env.example (template de configuracao)
- .htaccess (configuracao Apache)
- uploads/ (pasta para arquivos enviados)

## ANTES DE FAZER UPLOAD

1. Configure o .env
   - Copie .env.example para .env
   - Edite com as credenciais do servidor Reposit:
     * MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
     * JWT_SECRET (gere uma senha forte de 32+ caracteres)
     * SMTP_USER, SMTP_PASS (email Zoho)
     * Atualize URLs: BASE_URL, FRONTEND_URL, CORS_ORIGIN

2. Verifique o .htaccess
   - Confirme a porta do Node.js (padrao: 3100)
   - Ajuste se necessario

## PASSOS NO SERVIDOR

1. Upload via FTP
   - Servidor: (fornecido pela Reposit)
   - Usuario: (fornecido pela Reposit)
   - Caminho: /public_html/app/

2. Conectar via SSH
   ssh usuario@servidor.reposit.com.br

3. Navegar ate a pasta
   cd public_html/app

4. Instalar dependencias
   npm install --production

5. Importar banco de dados
   mysql -u usuario -p nome_banco < scripts/sql/create_mysql_schema.sql
   mysql -u usuario -p nome_banco < scripts/sql/seed_produtos.sql

6. Criar usuario admin
   node scripts/seed_admin.js

7. Iniciar com PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup

8. Verificar status
   pm2 status
   pm2 logs nexus-b2b

## TESTAR

Acesse: http://seudominio.com.br

Login admin:
- Email: admin@example.com
- Senha: Admin@123

## SUPORTE

Consulte: DEPLOY-REPOSIT.md para guia completo
Checklist: CHECKLIST-REPOSIT.md

