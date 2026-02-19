const express = require('express');
const pool = require('../config/db.mysql');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');

const router = express.Router();

// Solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    console.log('🔑 Solicitação de recuperação de senha para:', email);
    
    // Buscar usuário
    const [[usuario]] = await pool.execute(
      'SELECT id, nome, email FROM usuarios WHERE email = ?',
      [email]
    );
    
    if (!usuario) {
      // Por segurança, não revelar se o email existe ou não
      console.log('⚠️  Email não encontrado:', email);
      return res.json({ 
        message: 'Se o email existir em nossa base, você receberá um link de recuperação.' 
      });
    }
    
    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora
    
    // Salvar token no banco
    await pool.execute(
      'INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)',
      [usuario.id, token, expiresAt]
    );
    
    console.log('✅ Token gerado:', token.substring(0, 10) + '...');
    
    // Enviar email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3100'}/reset-password.html?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recuperação de Senha - B2B Brago Distribuidora</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🔑 Recuperação de Senha</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">B2B Brago Distribuidora</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e5e5e5;">
          <h2 style="color: #3b82f6; margin-top: 0;">Olá, ${usuario.nome}!</h2>
          
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no sistema B2B Brago Distribuidora.</p>
          
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
          <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} B2B Brago Distribuidora - Sistema de Gestão Comercial</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">Este é um email automático. Não responda.</p>
        </div>
        
      </body>
      </html>
    `;
    
    await emailService.enviarEmail(
      usuario.email,
      '🔑 Recuperação de Senha - B2B Brago Distribuidora',
      htmlContent
    );
    
    console.log('✅ Email de recuperação enviado para:', usuario.email);
    
    res.json({ 
      message: 'Se o email existir em nossa base, você receberá um link de recuperação.' 
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar recuperação de senha:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Validar token
router.get('/validate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const [[tokenData]] = await pool.execute(
      `SELECT prt.*, u.email, u.nome 
       FROM password_reset_tokens prt
       JOIN usuarios u ON u.id = prt.usuario_id
       WHERE prt.token = ? AND prt.usado = 0 AND prt.expires_at > NOW()`,
      [token]
    );
    
    if (!tokenData) {
      return res.status(400).json({ 
        error: 'Token inválido ou expirado',
        valid: false 
      });
    }
    
    res.json({ 
      valid: true,
      email: tokenData.email,
      nome: tokenData.nome
    });
    
  } catch (error) {
    console.error('❌ Erro ao validar token:', error);
    res.status(500).json({ error: 'Erro ao validar token' });
  }
});

// Redefinir senha
router.post('/reset-password', async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    const { token, novaSenha } = req.body;
    
    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }
    
    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }
    
    await conn.beginTransaction();
    
    // Buscar token válido
    const [[tokenData]] = await conn.execute(
      `SELECT prt.*, u.id as usuario_id, u.email 
       FROM password_reset_tokens prt
       JOIN usuarios u ON u.id = prt.usuario_id
       WHERE prt.token = ? AND prt.usado = 0 AND prt.expires_at > NOW()
       FOR UPDATE`,
      [token]
    );
    
    if (!tokenData) {
      await conn.rollback();
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }
    
    // Hash da nova senha
    const hash = await bcrypt.hash(novaSenha, parseInt(process.env.BCRYPT_ROUNDS || '10'));
    
    // Atualizar senha do usuário
    await conn.execute(
      'UPDATE usuarios SET senha = ? WHERE id = ?',
      [hash, tokenData.usuario_id]
    );
    
    // Marcar token como usado
    await conn.execute(
      'UPDATE password_reset_tokens SET usado = 1 WHERE id = ?',
      [tokenData.id]
    );
    
    await conn.commit();
    
    console.log('✅ Senha redefinida com sucesso para:', tokenData.email);
    
    // Enviar email de confirmação
    try {
      const confirmacaoHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Senha Alterada - B2B Brago Distribuidora</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">✅ Senha Alterada com Sucesso</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e5e5e5;">
            <p>Sua senha foi alterada com sucesso!</p>
            
            <p>Agora você já pode fazer login no sistema B2B Brago Distribuidora com sua nova senha.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3100'}/login.html" 
                 style="display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🔐 Fazer Login
              </a>
            </div>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #1e40af;">ℹ️ Segurança:</p>
              <p style="margin: 5px 0 0 0; color: #1e40af;">
                Se você não realizou esta alteração, entre em contato com o suporte imediatamente.
              </p>
            </div>
          </div>
          
          <div style="background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} B2B Brago Distribuidora</p>
          </div>
          
        </body>
        </html>
      `;
      
      await emailService.enviarEmail(
        tokenData.email,
        '✅ Senha Alterada com Sucesso - B2B Brago Distribuidora',
        confirmacaoHtml
      );
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email de confirmação:', emailError);
      // Não falha a operação
    }
    
    res.json({ message: 'Senha redefinida com sucesso!' });
    
  } catch (error) {
    await conn.rollback();
    console.error('❌ Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  } finally {
    conn.release();
  }
});

module.exports = router;
