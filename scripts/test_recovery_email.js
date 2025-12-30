require('dotenv').config();
const emailService = require('../src/services/emailService');

async function testRecoveryEmail() {
  try {
    console.log('🧪 TESTANDO ENVIO DE EMAIL DE RECUPERAÇÃO\n');
    
    const testEmail = 'edson.silva@bragodistribuidora.com.br';
    const token = 'TEST123456789ABC'; // Token fake para teste
    const resetLink = `http://localhost:3100/reset-password.html?token=${token}`;
    
    console.log('📧 Enviando email de teste para:', testEmail);
    console.log('🔗 Link de recuperação:', resetLink);
    console.log('');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recuperação de Senha - Nexus B2B</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🔑 Recuperação de Senha</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Nexus B2B</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e5e5e5;">
          <h2 style="color: #3b82f6; margin-top: 0;">Olá, Teste!</h2>
          
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no sistema Nexus B2B.</p>
          
          <p>Para criar uma nova senha, clique no botão abaixo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🔐 Redefinir Minha Senha
            </a>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ Importante:</p>
            <p style="margin: 5px 0 0 0; color: #92400e;">
              Este link expira em <strong>1 hora</strong>.<br>
              Se você não solicitou esta redefinição, ignore este email.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
          </p>
          <p style="background: white; padding: 10px; border: 1px solid #e5e5e5; border-radius: 4px; word-break: break-all; font-size: 12px; color: #666;">
            ${resetLink}
          </p>
        </div>
        
        <div style="background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} Nexus B2B - Sistema de Gestão Comercial</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">Este é um email automático. Não responda.</p>
        </div>
        
      </body>
      </html>
    `;
    
    const result = await emailService.enviarEmail(
      testEmail,
      '🔑 Teste - Recuperação de Senha - Nexus B2B',
      htmlContent
    );
    
    if (result.success) {
      console.log('✅ EMAIL ENVIADO COM SUCESSO!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`\n🎯 Verifique a caixa de entrada de: ${testEmail}`);
      console.log('   Não esqueça de verificar a pasta de SPAM também!\n');
    } else {
      console.log('❌ ERRO ao enviar email:', result.error);
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ ERRO:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRecoveryEmail();
