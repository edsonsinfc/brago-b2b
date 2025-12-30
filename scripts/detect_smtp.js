require('dotenv').config();
const nodemailer = require('nodemailer');
const dns = require('dns').promises;

async function detectarConfigSMTP() {
  try {
    console.log('🔍 Detectando configuração SMTP para email corporativo...\n');
    
    const email = process.env.EMAIL_USER;
    const domain = email.split('@')[1];
    
    console.log('📧 Email:', email);
    console.log('🌐 Domínio:', domain);
    console.log('');
    
    // Buscar registros MX
    console.log('🔎 Buscando servidores de email (MX records)...');
    try {
      const mxRecords = await dns.resolveMx(domain);
      console.log('✅ Servidores encontrados:');
      mxRecords.sort((a, b) => a.priority - b.priority).forEach(record => {
        console.log(`   - ${record.exchange} (prioridade: ${record.priority})`);
      });
      console.log('');
    } catch (error) {
      console.log('❌ Não foi possível buscar registros MX');
    }
    
    // Configurações comuns para email corporativo
    const configuracoes = [
      {
        nome: 'Outlook/Office 365',
        host: 'smtp.office365.com',
        port: 587,
        secure: false
      },
      {
        nome: 'Gmail (se usar Google Workspace)',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false
      },
      {
        nome: 'Servidor SMTP da Brago',
        host: `smtp.${domain}`,
        port: 587,
        secure: false
      },
      {
        nome: 'Servidor SMTP alternativo',
        host: `mail.${domain}`,
        port: 587,
        secure: false
      }
    ];
    
    console.log('🧪 Testando configurações possíveis...\n');
    
    for (const config of configuracoes) {
      console.log(`📡 Testando: ${config.nome}`);
      console.log(`   Host: ${config.host}`);
      console.log(`   Porta: ${config.port}`);
      
      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: email,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            rejectUnauthorized: false // Para testes
          }
        });
        
        // Tentar verificar conexão
        await transporter.verify();
        console.log('   ✅ CONEXÃO BEM-SUCEDIDA!\n');
        console.log('═══════════════════════════════════════════════════');
        console.log('🎉 Configuração correta encontrada!');
        console.log('═══════════════════════════════════════════════════');
        console.log('');
        console.log('📝 Adicione estas variáveis no .env:');
        console.log('');
        console.log(`EMAIL_HOST=${config.host}`);
        console.log(`EMAIL_PORT=${config.port}`);
        console.log(`EMAIL_USER=${email}`);
        console.log(`EMAIL_PASS=sua-senha`);
        console.log('');
        
        // Tentar enviar email de teste
        console.log('📤 Tentando enviar email de teste...');
        await transporter.sendMail({
          from: email,
          to: email,
          subject: '🧪 Teste de Configuração - Nexus B2B',
          text: 'Se você recebeu este email, a configuração está correta!'
        });
        console.log('✅ Email de teste enviado com sucesso!');
        console.log(`📬 Verifique a caixa de entrada de: ${email}`);
        
        process.exit(0);
      } catch (error) {
        console.log(`   ❌ Falhou: ${error.message}`);
        console.log('');
      }
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('❌ Nenhuma configuração automática funcionou');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('💡 Você precisa descobrir as configurações SMTP corretas.');
    console.log('');
    console.log('📞 Entre em contato com o suporte de TI da Brago e pergunte:');
    console.log('   1. Qual é o servidor SMTP? (ex: smtp.empresa.com.br)');
    console.log('   2. Qual é a porta SMTP? (geralmente 587 ou 465)');
    console.log('   3. Requer autenticação? (geralmente SIM)');
    console.log('   4. Usa TLS/SSL? (geralmente SIM)');
    console.log('');
    console.log('🔑 Alternativas:');
    console.log('   1. Usar Gmail com senha de app');
    console.log('   2. Usar Outlook/Office 365');
    console.log('   3. Configurar o email corporativo corretamente');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

detectarConfigSMTP();
