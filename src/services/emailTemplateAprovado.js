// Template corrigido para email de pedido aprovado
module.exports = function gerarTemplatePedidoAprovado(pedido, equipe, comprador, gestor, itens) {
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
        <h1 style="margin: 0; font-size: 32px;">✅ Pedido Aprovado!</h1>
        <p style="margin: 10px 0 0 0; font-size: 22px; font-weight: bold;">Pedido #${pedido.id}</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <div style="background: #d1fae5; border-left: 5px solid #22c55e; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; color: #166534; font-size: 20px;">🎉 Ótimas notícias!</h2>
          <p style="margin: 0; color: #166534; font-size: 16px; line-height: 1.8;">
            O pedido foi <strong>aprovado pelo gestor</strong> e já está sendo processado.<br>
            Acompanhe abaixo os detalhes completos do pedido.
          </p>
        </div>
        
        <h2 style="color: #22c55e; margin-top: 0; border-bottom: 3px solid #22c55e; padding-bottom: 10px;">📋 Informações do Pedido</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">🏢 Equipe:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111827;">${equipe.nome}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">👤 Comprador:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111827;">${comprador.nome}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">✅ Aprovado por:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #22c55e;">${gestor.nome}</td>
            </tr>
            <tr style="border-top: 2px solid #e5e7eb;">
              <td style="padding: 12px 0 8px 0; color: #6b7280; font-weight: 600;">📅 Data do Pedido:</td>
              <td style="padding: 12px 0 8px 0; text-align: right; color: #111827;">${formatDate(pedido.data)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">✅ Data de Aprovação:</td>
              <td style="padding: 8px 0; text-align: right; color: #22c55e; font-weight: bold;">${formatDate(pedido.data_aprovacao)}</td>
            </tr>
            <tr style="border-top: 2px solid #e5e7eb;">
              <td style="padding: 12px 0 8px 0; color: #6b7280; font-weight: 600;">📋 Código ERP:</td>
              <td style="padding: 12px 0 8px 0; text-align: right; color: #111827;">${pedido.codigo_erp || '<span style="color: #9ca3af;">Não informado</span>'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">🏢 CGC/CNPJ:</td>
              <td style="padding: 8px 0; text-align: right; color: #111827;">${pedido.cgc || '<span style="color: #9ca3af;">Não informado</span>'}</td>
            </tr>
            <tr style="background: #f0fdf4; border-top: 3px solid #22c55e;">
              <td style="padding: 15px 10px; color: #166534; font-weight: 700; font-size: 18px;">💰 Valor Total:</td>
              <td style="padding: 15px 10px; text-align: right; color: #22c55e; font-size: 24px; font-weight: bold;">${formatMoney(pedido.valor_total)}</td>
            </tr>
          </table>
        </div>
        
        <h3 style="color: #22c55e; margin-bottom: 15px; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">🛒 Itens do Pedido</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Código</th>
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
          <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 18px;">✅ Pedido em Processamento</h3>
          <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.7;">
            <strong>Status:</strong> <span style="background: #22c55e; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold;">APROVADO</span><br><br>
            O pedido foi registrado no sistema e está sendo preparado para envio.<br>
            Você receberá atualizações sobre o andamento do pedido.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center; border: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
            📧 Este email foi enviado automaticamente pelo sistema B2B Brago Distribuidora<br>
            <strong>Sistema de Gestão Comercial</strong> - Para mais informações, entre em contato com o setor comercial.
          </p>
        </div>
      </div>
      
      <div style="background: #1f2937; color: #e5e7eb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">B2B Brago Distribuidora</p>
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Sistema de Gestão Comercial - Todos os direitos reservados</p>
      </div>
      
    </body>
    </html>
  `;
};
