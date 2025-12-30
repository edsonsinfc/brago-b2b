require('dotenv').config();
const nodemailer = require('nodemailer');

async function testarEnvioEmail() {
  try {
    console.log('📧 Testando envio de email...\n');
    
    // Verificar configuração
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'seu-email@gmail.com') {
      console.log('❌ EMAIL_USER não está configurado corretamente no .env');
      console.log('   Configure com seu email real do Gmail\n');
      console.log('💡 Veja as instruções em: CONFIGURACAO-EMAIL.md');
      process.exit(1);
    }
    
    if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'sua-senha-de-app-aqui') {
      console.log('❌ EMAIL_PASS não está configurado corretamente no .env');
      console.log('   Configure com a senha de app do Gmail\n');
      console.log('💡 Veja as instruções em: CONFIGURACAO-EMAIL.md');
      process.exit(1);
    }
    
    console.log('✅ Configuração de email encontrada');
    console.log('   Remetente:', process.env.EMAIL_USER);
    console.log('   Destinatário: edson.silva@bragodistribuidora.com.br\n');
    
    // Criar transporter
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('🔄 Enviando email de teste...');
    
    // Enviar email de teste
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Nexus B2B <${process.env.EMAIL_USER}>`,
      to: 'edson.silva@bragodistribuidora.com.br',
      subject: '🧪 Teste - Sistema Nexus B2B',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0066cc, #0052a3); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🧪 Email de Teste</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e5e5e5;">
            <h2 style="color: #0066cc;">✅ Sistema de Email Configurado!</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>🎉 Parabéns!</strong> O sistema de email do Nexus B2B está funcionando corretamente.</p>
              <p>Você receberá notificações automáticas quando:</p>
              <ul>
                <li>✅ Um novo pedido for criado pela sua equipe</li>
                <li>✅ Um pedido for aprovado pelo gestor</li>
                <li>✅ Houver alertas de saldo</li>
              </ul>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
              <p style="margin: 0; color: #666;">
                📧 Este é um email de teste do sistema Nexus B2B<br>
                Data: ${new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div style="background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} Nexus B2B - Sistema de Gestão Comercial</p>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('\n✅ Email enviado com sucesso!');
    console.log('   Message ID:', info.messageId);
    console.log('\n📬 Verifique a caixa de entrada de: edson.silva@bragodistribuidora.com.br');
    console.log('   (Confira também a pasta de spam)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao enviar email:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Erro de autenticação:');
      console.log('   - Verifique se EMAIL_USER e EMAIL_PASS estão corretos');
      console.log('   - Use uma senha de app do Gmail, não a senha normal');
      console.log('   - Crie em: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Erro de conexão:');
      console.log('   - Verifique sua conexão com a internet');
      console.log('   - Confira se o firewall não está bloqueando');
    }
    
    console.log('\n📚 Consulte: CONFIGURACAO-EMAIL.md');
    process.exit(1);
  }
}

testarEnvioEmail();
