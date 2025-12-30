const mysql = require('mysql2/promise');

async function testarFluxoAprovacao() {
  console.log('🧪 TESTE: Fluxo de Aprovação de Pedido com Email\n');
  
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    // 1. Buscar pedido #19 que foi aprovado
    const [[pedido]] = await conn.execute(`
      SELECT p.*, e.nome as equipe_nome, e.vendedor_email, e.limite_disponivel
      FROM pedidos p
      JOIN equipes e ON e.id = p.equipe_id
      WHERE p.id = 19
    `);
    
    if (!pedido) {
      console.log('❌ Pedido #19 não encontrado');
      return;
    }
    
    console.log('📋 Detalhes do Pedido #19:');
    console.log(`   Equipe: ${pedido.equipe_nome}`);
    console.log(`   Valor: R$ ${Number(pedido.valor_total).toFixed(2)}`);
    console.log(`   Status: ${pedido.status}`);
    console.log(`   Data: ${pedido.data}`);
    console.log(`   Vendedor Email: ${pedido.vendedor_email || '❌ NÃO CONFIGURADO'}`);
    
    // 2. Buscar itens do pedido
    const [itens] = await conn.execute(
      'SELECT * FROM itens_pedido WHERE pedido_id = 19'
    );
    
    console.log(`\n📦 Itens do Pedido: ${itens.length} produto(s)`);
    itens.forEach(item => {
      console.log(`   - ${item.descricao} (${item.quantidade}x) = R$ ${Number(item.valor_total).toFixed(2)}`);
    });
    
    // 3. Verificar o que acontece na aprovação
    console.log('\n🔍 Fluxo de Aprovação:');
    console.log('   1. Gestor clica em "Aprovar" no painel');
    console.log('   2. Backend: PUT /api/pedidos/19/aprovar');
    console.log('   3. Status alterado: PENDENTE_APROVACAO → APROVADO');
    console.log('   4. Limite debitado da equipe');
    console.log('   5. Email enviado para vendedor');
    
    // 4. Verificar configuração de email
    console.log('\n📧 Configuração de Email:');
    if (pedido.vendedor_email) {
      console.log(`   ✅ Vendedor Email: ${pedido.vendedor_email}`);
      console.log(`   ✅ Função: emailService.enviarNotificacaoPedido()`);
      console.log(`   ✅ Template: Email verde "Novo Pedido Recebido"`);
    } else {
      console.log(`   ❌ PROBLEMA: vendedor_email não configurado!`);
      console.log(`   ⚠️  Email NÃO será enviado até configurar o email da equipe`);
    }
    
    // 5. Verificar variáveis de ambiente de email
    console.log('\n🔧 Configuração SMTP:');
    console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || 'smtp.gmail.com (padrão)'}`);
    console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || '587 (padrão)'}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || '❌ NÃO CONFIGURADO'}`);
    console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('\n⚠️  ATENÇÃO: Variáveis de ambiente de email não configuradas!');
      console.log('   Para enviar emails, configure no arquivo .env:');
      console.log('   EMAIL_HOST=smtp.gmail.com');
      console.log('   EMAIL_PORT=587');
      console.log('   EMAIL_USER=seu-email@gmail.com');
      console.log('   EMAIL_PASS=sua-senha-de-app');
    }
    
    // 6. Resumo
    console.log('\n✅ Correção Implementada:');
    console.log('   🔧 Linha 511: enviarEmailPedido() → enviarNotificacaoPedido()');
    console.log('   🔧 Adicionado logs detalhados do envio de email');
    console.log('   🔧 Estrutura correta do objeto para emailService');
    
    console.log('\n🎯 Como Testar Novamente:');
    console.log('   1. Configure as variáveis de ambiente de email (se ainda não fez)');
    console.log('   2. Reinicie o servidor: node src/server.js');
    console.log('   3. Crie um novo pedido acima do limite');
    console.log('   4. Aprove o pedido no painel do gestor');
    console.log('   5. Verifique os logs do servidor para ver o envio do email');
    console.log('   6. Verifique a caixa de entrada do vendedor_email');
    
  } finally {
    await conn.end();
  }
}

// Carregar variáveis de ambiente se existir .env
try {
  require('dotenv').config();
} catch (e) {
  // dotenv não instalado ou .env não existe
}

testarFluxoAprovacao().catch(console.error);
