require('dotenv').config();
const nodemailer = require('nodemailer');

async function testarZoho() {
  try {
    console.log('📧 Testando configuração Zoho Mail...\n');
    
    console.log('⚙️  Configuração:');
    console.log('   Host:', process.env.EMAIL_HOST);
    console.log('   Porta:', process.env.EMAIL_PORT);
    console.log('   Usuário:', process.env.EMAIL_USER);
    console.log('');
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('🔄 Verificando conexão...');
    await transporter.verify();
    console.log('✅ Conexão bem-sucedida!\n');
    
    console.log('📤 Enviando email de teste...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: '🎉 Teste - Sistema Nexus B2B - Zoho Mail',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #00a650, #008c42); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0;">🎉 Email Configurado!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e5e5e5;">
            <h2 style="color: #00a650;">✅ Zoho Mail Funcionando!</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>🎊 Parabéns!</strong> O sistema de email está configurado corretamente com Zoho Mail.</p>
              
              <p><strong>📋 Configuração atual:</strong></p>
              <ul>
                <li>Servidor: smtp.zoho.com</li>
                <li>Porta: 587</li>
                <li>Email: ${process.env.EMAIL_USER}</li>
              </ul>
              
              <p><strong>🔔 Notificações ativas para:</strong></p>
              <ul>
                <li>✅ Novos pedidos criados</li>
                <li>✅ Pedidos aprovados</li>
                <li>✅ Alertas de saldo</li>
              </ul>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Próximo passo:</strong> Crie um pedido de teste e veja o email chegar automaticamente!</p>
            </div>
          </div>
          
          <div style="background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Nexus B2B - Brago Distribuidora</p>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log('   Message ID:', info.messageId);
    console.log('\n📬 Verifique sua caixa de entrada: edson.silva@bragodistribuidora.com.br');
    console.log('   (Pode demorar alguns segundos)\n');
    
    console.log('🎯 Próximos passos:');
    console.log('   1. ✅ Configuração de email completa!');
    console.log('   2. Reinicie o servidor: node src/server.js');
    console.log('   3. Crie um pedido de teste');
    console.log('   4. Aguarde o email automático chegar\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Erro de autenticação:');
      console.log('   - Verifique se o email e senha estão corretos');
      console.log('   - Tente fazer login no Zoho Mail pelo navegador');
      console.log('   - Pode ser necessário habilitar acesso de apps');
    }
    
    process.exit(1);
  }
}

testarZoho();
