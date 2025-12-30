const pool = require('../src/config/db.mysql');
const emailService = require('../src/services/emailService');

async function testarEmail() {
  try {
    console.log('📧 Testando envio de email...\n');
    
    // Buscar um pedido existente
    const [pedidos] = await pool.execute(`
      SELECT * FROM pedidos 
      WHERE id = 23
      LIMIT 1
    `);
    
    if (pedidos.length === 0) {
      console.log('❌ Pedido #23 não encontrado');
      return;
    }
    
    const pedido = pedidos[0];
    console.log(`✅ Pedido encontrado: #${pedido.id}`);
    
    // Buscar equipe
    const [equipes] = await pool.execute(`
      SELECT * FROM equipes WHERE id = ?
    `, [pedido.equipe_id]);
    
    const equipe = equipes[0];
    console.log(`✅ Equipe: ${equipe.nome}`);
    
    // Buscar itens
    const [itens] = await pool.execute(`
      SELECT * FROM itens_pedido WHERE pedido_id = ?
    `, [pedido.id]);
    
    console.log(`✅ Itens: ${itens.length} produtos\n`);
    
    // Enviar email de teste para os vendedores
    const emailsVendedores = await emailService.obterEmailsNotificacao('vendedor');
    console.log(`📬 Enviando para: ${emailsVendedores.join(', ')}\n`);
    
    for (const email of emailsVendedores) {
      console.log(`Enviando para ${email}...`);
      const resultado = await emailService.enviarNotificacaoPedido({
        pedido,
        equipe,
        itens,
        vendedorEmail: email
      });
      
      if (resultado.success) {
        console.log(`✅ Email enviado com sucesso!`);
        console.log(`   Message ID: ${resultado.messageId}\n`);
      } else {
        console.log(`❌ Erro: ${resultado.error}\n`);
      }
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

testarEmail();
