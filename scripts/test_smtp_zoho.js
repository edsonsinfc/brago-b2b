require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 TESTANDO CONEXÃO SMTP ZOHO\n');
console.log('Configurações:');
console.log(`   Host: ${process.env.EMAIL_HOST}`);
console.log(`   Port: ${process.env.EMAIL_PORT}`);
console.log(`   User: ${process.env.EMAIL_USER}`);
console.log(`   Pass: ${'*'.repeat(process.env.EMAIL_PASS?.length || 0)}\n`);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true,
  logger: true
});

console.log('⏳ Verificando conexão com servidor SMTP...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ ERRO NA CONEXÃO SMTP:');
    console.error(error.message);
    console.error('\nDetalhes completos:', error);
    
    console.log('\n📋 Possíveis causas:');
    console.log('1. Servidor SMTP temporariamente indisponível');
    console.log('2. Senha incorreta ou expirada');
    console.log('3. Zoho bloqueou acesso (verificar 2FA)');
    console.log('4. Precisa gerar senha de aplicativo na Zoho');
    console.log('5. Firewall/antivírus bloqueando porta 587');
    
    console.log('\n🔧 Soluções:');
    console.log('• Acesse: https://accounts.zoho.com/home#security/apppasswords');
    console.log('• Gere uma "Application-Specific Password"');
    console.log('• Atualize EMAIL_PASS no .env com essa senha');
    
    process.exit(1);
  } else {
    console.log('✅ CONEXÃO SMTP OK!');
    console.log('   Servidor Zoho respondendo corretamente');
    console.log('   Autenticação válida\n');
    
    // Tenta enviar email de teste
    console.log('📧 Enviando email de teste...\n');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Envia para si mesmo
      subject: '✅ Teste de Email - Nexus B2B',
      html: `
        <h2>🎉 Email de Teste - Sistema Funcionando!</h2>
        <p>Este é um email de teste enviado pelo sistema Nexus B2B.</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Servidor:</strong> ${process.env.EMAIL_HOST}</p>
        <p>Se você recebeu este email, a configuração está correta! ✅</p>
      `
    };
    
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('❌ Erro ao enviar email:', err.message);
        process.exit(1);
      } else {
        console.log('✅ EMAIL ENVIADO COM SUCESSO!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log('\n🎯 Verifique a caixa de entrada de:', process.env.EMAIL_USER);
        process.exit(0);
      }
    });
  }
});
