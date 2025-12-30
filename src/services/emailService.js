const nodemailer = require('nodemailer');
const pool = require('../config/db.mysql');
// Certifique-se de que este arquivo importado também esteja salvo como UTF-8
const gerarTemplatePedidoAprovado = require('./emailTemplateAprovado');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  async obterEmailsNotificacao(tipo) {
    try {
      const [emails] = await pool.execute(`
        SELECT email, nome
        FROM usuarios
        WHERE perfil = 'vendedor' AND ativo = true
        ORDER BY nome ASC
      `);
      
      return emails.map(e => e.email);
    } catch (error) {
      console.error(' Erro ao obter emails de vendedores:', error);
      return [];
    }
  }
  
  getTransporter() {
    if (!this.transporter) {
      const emailPort = parseInt(process.env.EMAIL_PORT || '587');
      const isSecure = emailPort === 465 || process.env.EMAIL_SECURE === 'true';
      
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: emailPort,
        secure: isSecure, // true para porta 465 (SSL), false para outras portas (TLS)
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Configurações anti-timeout
        connectionTimeout: 30000, 
        greetingTimeout: 30000, 
        socketTimeout: 60000, 
        pool: true, 
        maxConnections: 5,
        maxMessages: 100,
        tls: {
          rejectUnauthorized: false
        }
      });
      
      console.log(' Transporter de email criado');
      console.log('   Host:', process.env.EMAIL_HOST);
      console.log('   Port:', emailPort);
    }
    
    return this.transporter;
  }
  
  async enviarNotificacaoPedido(pedidoData) {
    try {
      const { pedido, equipe, itens, vendedorEmail } = pedidoData;
      
      if (!vendedorEmail) {
        console.log('  Email do vendedor nao configurado para a equipe');
        return { success: false, error: 'Email do vendedor nao configurado' };
      }
      
      const htmlTemplate = this.gerarTemplateEmail(pedido, equipe, itens);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: vendedorEmail,
        subject: `Novo Pedido #${pedido.id} - ${equipe.nome}`,
        html: htmlTemplate,
        // Removemos o 'textEncoding' forçado para deixar o nodemailer decidir a melhor estrategia
        // Mas mantemos os headers explícitos para garantir UTF-8
        headers: {
          'Content-Type': 'text/html; charset=UTF-8'
        }
      };
      
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      
      console.log(` Email enviado para ${vendedorEmail} - Pedido #${pedido.id}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(' Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }
  }
  
  async enviarEmail(destinatario, assunto, htmlContent) {
    try {
      if (!destinatario) {
        console.log('  Email destinatario nao fornecido');
        return { success: false, error: 'Email destinatario nao fornecido' };
      }
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: destinatario,
        subject: assunto,
        html: htmlContent,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8'
        }
      };
      
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      
      console.log(` Email enviado para ${destinatario}`);
      console.log(`   Assunto: ${assunto}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(' Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }
  }
  
  async enviarSolicitacaoAprovacao(pedidoData) {
    try {
      const { pedido, equipe, itens, vendedorEmail, motivoPendencia } = pedidoData;
      
      if (!vendedorEmail) {
        console.log('  Email do vendedor nao configurado para a equipe');
        return { success: false, error: 'Email do vendedor nao configurado' };
      }
      
      const htmlTemplate = this.gerarTemplateAprovacao(pedido, equipe, itens, motivoPendencia);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: vendedorEmail,
        subject: `APROVACAO NECESSÁRIA - Pedido #${pedido.id} - ${equipe.nome}`,
        html: htmlTemplate,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8'
        }
      };
      
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      
      console.log(` Email de aprovacao enviado para ${vendedorEmail} - Pedido #${pedido.id}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(' Erro ao enviar email de aprovacao:', error);
      return { success: false, error: error.message };
    }
  }
  
  async enviarNotificacaoPedidoPendente(pedidoData) {
    try {
      const { pedido, equipe, itens, vendedorEmail, motivoPendencia } = pedidoData;
      
      if (!vendedorEmail) {
        console.log('  Email do vendedor nao configurado para a equipe');
        return { success: false, error: 'Email do vendedor nao configurado' };
      }
      
      const htmlTemplate = this.gerarTemplateNotificacaoPendente(pedido, equipe, itens, motivoPendencia);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: vendedorEmail,
        subject: `Pedido Pendente de Aprovacao #${pedido.id} - ${equipe.nome}`,
        html: htmlTemplate,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8'
        }
      };
      
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      
      console.log(` Email de notificação de pedido pendente enviado para ${vendedorEmail} - Pedido #${pedido.id}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(' Erro ao enviar email de notificação de pedido pendente:', error);
      return { success: false, error: error.message };
    }
  }
  
  gerarTemplateEmail(pedido, equipe, itens) {
    const formatMoney = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };
    
    const formatDate = (date) => {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    };
    
    const itensHtml = itens.map(item => `
      <tr style="border-bottom: 1px solid #e5e5e5;">
        <td style="padding: 8px;">${item.codprod}</td>
        <td style="padding: 8px;">${item.descricao}</td>
        <td style="padding: 8px; text-align: center;">${item.quantidade}</td>
        <td style="padding: 8px; text-align: right;">${formatMoney(item.valor_unitario || 0)}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold;">${formatMoney((item.valor_unitario || 0) * (item.quantidade || 0))}</td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo Pedido - B2B Brago Distribuidora</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Novo Pedido Recebido</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Pedido #${pedido.id}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e5e5e5;">
          <h2 style="color: #22c55e; margin-top: 0;"> Informacoes do Pedido</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong> Equipe:</strong> ${equipe.nome}</p>
            <p><strong> Data:</strong> ${formatDate(pedido.data)}</p>
            <p><strong> Valor Total:</strong> <span style="color: #22c55e; font-size: 20px; font-weight: bold;">${formatMoney(pedido.valor_total)}</span></p>
            <p><strong> Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px;">${pedido.status}</span></p>
            <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e5e5;"><strong> Codigo ERP:</strong> ${pedido.codigo_erp || '<span style="color: #9ca3af;">Nao informado</span>'}</p>
            <p><strong> CGC/CNPJ:</strong> ${pedido.cgc || '<span style="color: #9ca3af;">Nao informado</span>'}</p>
          </div>
          
          <h3 style="color: #22c55e;"> Itens do Pedido</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #22c55e; color: white;">
                <th style="padding: 12px; text-align: left;">Codigo</th>
                <th style="padding: 12px; text-align: left;">Produto</th>
                <th style="padding: 12px; text-align: center;">Qtd</th>
                <th style="padding: 12px; text-align: right;">Valor Unit.</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itensHtml}
            </tbody>
          </table>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; color: #666;">
               Este email foi enviado automaticamente pelo sistema B2B Brago Distribuidora<br>
              Para mais Informacoes, acesse o painel administrativo.
            </p>
          </div>
        </div>
        
        <div style="background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} B2B Brago Distribuidora - Sistema de Gestao Comercial</p>
        </div>
        
      </body>
      </html>
    `;
  }
  
  gerarTemplateAprovacao(pedido, equipe, itens, motivoPendencia) {
    const formatMoney = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };
    
    const formatDate = (date) => {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    };
    
    const itensHtml = itens.map(item => `
      <tr style="border-bottom: 1px solid #e5e5e5;">
        <td style="padding: 8px;">${item.codprod}</td>
        <td style="padding: 8px;">${item.descricao}</td>
        <td style="padding: 8px; text-align: center;">${item.quantidade}</td>
        <td style="padding: 8px; text-align: right;">${formatMoney(item.valor_unitario || 0)}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold;">${formatMoney((item.valor_unitario || 0) * (item.quantidade || 0))}</td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Aprovacao de Pedido - B2B Brago Distribuidora</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;"> APROVACAO NECESSÁRIA</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Pedido #${pedido.id} - Limite de Crédito Excedido</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e5e5e5;">
          
          <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #92400e;"> Motivo da Pendencia:</p>
            <p style="margin: 5px 0 0 0; color: #92400e;">${motivoPendencia}</p>
          </div>
          
          <h2 style="color: #f59e0b; margin-top: 0;"> Informacoes do Pedido</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p><strong> Equipe:</strong> ${equipe.nome}</p>
            <p><strong> Data:</strong> ${formatDate(pedido.data)}</p>
            <p><strong> Valor Total:</strong> <span style="color: #f59e0b; font-size: 20px; font-weight: bold;">${formatMoney(pedido.valor_total)}</span></p>
            <p><strong> Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px;">PENDENTE DE APROVACAO</span></p>
            <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e5e5;"><strong> Codigo ERP:</strong> ${pedido.codigo_erp || '<span style="color: #9ca3af;">Nao informado</span>'}</p>
            <p><strong> CGC/CNPJ:</strong> ${pedido.cgc || '<span style="color: #9ca3af;">Nao informado</span>'}</p>
          </div>
          
          <h3 style="color: #f59e0b;"> Itens do Pedido</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #f59e0b; color: white;">
                <th style="padding: 12px; text-align: left;">Codigo</th>
                <th style="padding: 12px; text-align: left;">Produto</th>
                <th style="padding: 12px; text-align: center;">Qtd</th>
                <th style="padding: 12px; text-align: right;">Valor Unit.</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itensHtml}
            </tbody>
          </table>
          
          <div style="background: #dcfce7; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #166534;">👨‍💼 Ação Necessária</h3>
            <p style="margin: 0 0 15px 0; color: #166534;">
              Acesse o painel administrativo para:<br>
              <strong>• Aprovar o pedido aumentando o limite</strong><br>
              <strong>• Rejeitar o pedido com justificativa</strong>
            </p>
            <a href="http://localhost:3100/gestor.html" style="display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; margin-top: 10px;">
               Acessar Painel do Gestor
            </a>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; color: #666;">
               Este email foi enviado automaticamente pelo sistema B2B Brago Distribuidora<br>
              <strong>Resposta urgente Necessária!</strong>
            </p>
          </div>
        </div>
        
        <div style="background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} B2B Brago Distribuidora - Sistema de Gestao Comercial</p>
        </div>
        
      </body>
      </html>
    `;
  }
  
  gerarTemplateNotificacaoPendente(pedido, equipe, itens, motivoPendencia) {
    const formatMoney = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };
    
    const formatDate = (date) => {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    };
    
    const itensHtml = itens.map(item => `
      <tr style="border-bottom: 1px solid #e5e5e5;">
        <td style="padding: 8px;">${item.codprod}</td>
        <td style="padding: 8px;">${item.descricao}</td>
        <td style="padding: 8px; text-align: center;">${item.quantidade}</td>
        <td style="padding: 8px; text-align: right;">${formatMoney(item.valor_unitario || 0)}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold;">${formatMoney((item.valor_unitario || 0) * (item.quantidade || 0))}</td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pedido Pendente - B2B Brago Distribuidora</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;"> Pedido Pendente de Aprovacao</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Pedido #${pedido.id} - Aguardando Aprovacao do Gestor</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e5e5e5;">
          
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #1e40af;">ℹ️ Status do Pedido:</p>
            <p style="margin: 5px 0 0 0; color: #1e40af;">Este pedido foi registrado mas aguarda Aprovacao do gestor devido ao limite de Crédito excedido.</p>
            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 14px;"><strong>Motivo:</strong> ${motivoPendencia}</p>
          </div>
          
          <h2 style="color: #3b82f6; margin-top: 0;"> Informacoes do Pedido</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p><strong> Equipe:</strong> ${equipe.nome}</p>
            <p><strong> Data:</strong> ${formatDate(pedido.data)}</p>
            <p><strong> Valor Total:</strong> <span style="color: #3b82f6; font-size: 20px; font-weight: bold;">${formatMoney(pedido.valor_total)}</span></p>
            <p><strong> Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px;">PENDENTE DE APROVACAO</span></p>
            <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e5e5;"><strong> Codigo ERP:</strong> ${pedido.codigo_erp || '<span style="color: #9ca3af;">Nao informado</span>'}</p>
            <p><strong> CGC/CNPJ:</strong> ${pedido.cgc || '<span style="color: #9ca3af;">Nao informado</span>'}</p>
          </div>
          
          <h3 style="color: #3b82f6;"> Itens do Pedido</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #3b82f6; color: white;">
                <th style="padding: 12px; text-align: left;">Codigo</th>
                <th style="padding: 12px; text-align: left;">Produto</th>
                <th style="padding: 12px; text-align: center;">Qtd</th>
                <th style="padding: 12px; text-align: right;">Valor Unit.</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itensHtml}
            </tbody>
          </table>
          
          <div style="background: #fff7ed; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;"> Próximos Passos</h3>
            <p style="margin: 0; color: #92400e;">
              <strong>1.</strong> O gestor foi notificado sobre este pedido<br>
              <strong>2.</strong> Aguarde a Aprovacao do gestor<br>
              <strong>3.</strong> Você será notificado quando o pedido for aprovado
            </p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; color: #666;">
               Este email foi enviado automaticamente pelo sistema B2B Brago Distribuidora<br>
              Este é apenas um aviso informativo sobre o pedido pendente.
            </p>
          </div>
        </div>
        
        <div style="background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} B2B Brago Distribuidora - Sistema de Gestao Comercial</p>
        </div>
        
      </body>
      </html>
    `;
  }

  async enviarPedidoAprovado(pedidoData) {
    try {
      const { pedido, equipe, comprador, gestor, itens } = pedidoData;
      
      // Buscar emails cadastrados para receber notificações de Aprovacao
      const destinatarios = await this.obterEmailsNotificacao('pedido_aprovado');
      
      if (!destinatarios || destinatarios.length === 0) {
        console.log('  Nenhum email de notificação configurado para pedidos aprovados');
        return { success: false, error: 'Nenhum email de notificação configurado' };
      }
      
      const htmlTemplate = this.gerarTemplatePedidoAprovado(pedido, equipe, comprador, gestor, itens);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: destinatarios.join(', '),
        subject: `PEDIDO APROVADO #${pedido.id} - ${equipe.nome}`,
        html: htmlTemplate,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8'
        }
      };
      
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      
      console.log(` Email de pedido aprovado enviado para: ${destinatarios.join(', ')} - Pedido #${pedido.id}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(' Erro ao enviar email de pedido aprovado:', error);
      return { success: false, error: error.message };
    }
  }

  gerarTemplatePedidoAprovado(pedido, equipe, comprador, gestor, itens) {
    const formatMoney = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };
    
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    };
    
    const itensHtml = itens.map(item => `
      <tr style="border-bottom: 1px solid #e5e5e5;">
        <td style="padding: 8px;">${item.codprod}</td>
        <td style="padding: 8px;">${item.descricao}</td>
        <td style="padding: 8px; text-align: center;">${item.quantidade}</td>
        <td style="padding: 8px; text-align: right;">${formatMoney(item.valor_unitario || 0)}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold;">${formatMoney((item.valor_unitario || 0) * (item.quantidade || 0))}</td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pedido Aprovado - B2B Brago Distribuidora</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="margin: 0; font-size: 32px;"> Pedido Aprovado!</h1>
          <p style="margin: 10px 0 0 0; font-size: 22px; font-weight: bold;">Pedido #${pedido.id}</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          
          <div style="background: #d1fae5; border-left: 5px solid #22c55e; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 15px 0; color: #166534; font-size: 20px;">🎉 Ótimas notícias!</h2>
            <p style="margin: 0; color: #166534; font-size: 16px; line-height: 1.8;">
              O pedido foi <strong>aprovado pelo gestor</strong> e ja esta sendo processado.<br>
              Acompanhe abaixo os detalhes completos do pedido.
            </p>
          </div>
          
          <h2 style="color: #22c55e; margin-top: 0; border-bottom: 3px solid #22c55e; padding-bottom: 10px;"> Informacoes do Pedido</h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;"> Equipe:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111827;">${equipe.nome}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">👤 Comprador:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111827;">${comprador.nome}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;"> Aprovado por:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #22c55e;">${gestor.nome}</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0 8px 0; color: #6b7280; font-weight: 600;"> Data do Pedido:</td>
                <td style="padding: 12px 0 8px 0; text-align: right; color: #111827;">${formatDate(pedido.data)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;"> Data de Aprovacao:</td>
                <td style="padding: 8px 0; text-align: right; color: #22c55e; font-weight: bold;">${formatDate(pedido.data_aprovacao)}</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0 8px 0; color: #6b7280; font-weight: 600;"> Codigo ERP:</td>
                <td style="padding: 12px 0 8px 0; text-align: right; color: #111827;">${pedido.codigo_erp || '<span style="color: #9ca3af;">Nao informado</span>'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;"> CGC/CNPJ:</td>
                <td style="padding: 8px 0; text-align: right; color: #111827;">${pedido.cgc || '<span style="color: #9ca3af;">Nao informado</span>'}</td>
              </tr>
              <tr style="background: #f0fdf4; border-top: 3px solid #22c55e;">
                <td style="padding: 15px 10px; color: #166534; font-weight: 700; font-size: 18px;"> Valor Total:</td>
                <td style="padding: 15px 10px; text-align: right; color: #22c55e; font-size: 24px; font-weight: bold;">${formatMoney(pedido.valor_total)}</td>
              </tr>
            </table>
          </div>
          
          <h3 style="color: #22c55e; margin-bottom: 15px; border-bottom: 2px solid #22c55e; padding-bottom: 8px;"> Itens do Pedido</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Codigo</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Produto</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600;">Qtd</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Valor Unit.</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itensHtml}
                <tr style="background: #f0fdf4; font-weight: bold; border-top: 3px solid #22c55e;">
                  <td colspan="4" style="padding: 15px; text-align: right; color: #166534; font-size: 16px;">TOTAL DO PEDIDO:</td>
                  <td style="padding: 15px; text-align: right; color: #22c55e; font-size: 20px;">${formatMoney(pedido.valor_total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 2px solid #22c55e; padding: 20px; border-radius: 10px; margin-top: 25px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 18px;">📦 Pedido em Processamento</h3>
            <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.7;">
              <strong>Status:</strong> <span style="background: #22c55e; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold;">APROVADO</span><br><br>
              O pedido foi registrado no sistema e esta sendo preparado para envio.<br>
              Você receberá atualizações sobre o andamento do pedido.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
               Este email foi enviado automaticamente pelo sistema B2B Brago Distribuidora<br>
              <strong>Sistema de Gestao Comercial</strong> - Para mais Informacoes, entre em contato com o setor comercial.
            </p>
          </div>
        </div>
        
        <div style="background: #1f2937; color: #e5e7eb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">B2B Brago Distribuidora</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Sistema de Gestao Comercial - Todos os direitos reservados</p>
        </div>
        
      </body>
      </html>
    `;
  }

  async enviarPedidoRejeitado(pedidoData) {
    try {
      const { pedido, motivo_rejeicao } = pedidoData;
      
      const destinatarios = await this.obterEmailsNotificacao('pedido_rejeitado');
      
      if (!destinatarios || destinatarios.length === 0) {
        console.log('  Nenhum email de notificação configurado para pedidos rejeitados');
        return { success: false, error: 'Nenhum email de notificação configurado' };
      }
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: destinatarios.join(', '),
        subject: `🚫 PEDIDO REJEITADO #${pedido.id}`,
        html: `<h2>Pedido Rejeitado</h2><p><strong>Pedido:</strong> #${pedido.id}</p><p><strong>Motivo:</strong> ${motivo_rejeicao || 'Nao especificado'}</p>`,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8'
        }
      };
      
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      
      console.log(` Email de pedido rejeitado enviado - Pedido #${pedido.id}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(' Erro ao enviar email de pedido rejeitado:', error);
      return { success: false, error: error.message };
    }
  }

  async enviarCodigoRecuperacao(email, codigo, nomeUsuario) {
    try {
      if (!email) {
        console.log('  Email destinatário não fornecido');
        return { success: false, error: 'Email destinatário não fornecido' };
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de Senha</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #003d82 0%, #005eb8 100%); padding: 30px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🔐 Recuperação de Senha</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Olá${nomeUsuario ? ' ' + nomeUsuario : ''},</p>
                      
                      <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                        Recebemos uma solicitação para recuperar a senha da sua conta no <strong>BRAGO B2B</strong>.
                      </p>
                      
                      <p style="margin: 0 0 30px 0; font-size: 16px; color: #333;">
                        Use o código abaixo para redefinir sua senha:
                      </p>
                      
                      <!-- Código -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 2px dashed #003d82;">
                            <span style="font-size: 32px; font-weight: bold; color: #003d82; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${codigo}
                            </span>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 20px 0; font-size: 14px; color: #666;">
                        ⏱️ <strong>Este código expira em 15 minutos.</strong>
                      </p>
                      
                      <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
                        Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.
                      </p>
                      
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0; font-size: 12px; color: #999;">
                          <strong>BRAGO Distribuidora</strong><br>
                          Sistema B2B de Gestão Comercial
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 40px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #999;">
                        © ${new Date().getFullYear()} BRAGO Distribuidora. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: '🔐 Código de Recuperação de Senha - BRAGO B2B',
        html: htmlContent,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8'
        }
      };

      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);

      console.log(`✅ Email de recuperação enviado para ${email}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar email de recuperação:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();