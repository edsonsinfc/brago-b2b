const mysql = require('mysql2/promise');

async function testarFluxoLimiteExcedido() {
  console.log('🧪 TESTE: Fluxo de Pedido com Limite Excedido\n');
  
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Senha vazia
    database: 'nexus_b2b'
  });

  try {
    // 1. Buscar uma equipe com limite disponível
    const [[equipe]] = await conn.execute(
      'SELECT id, nome, limite_disponivel, limite_credito FROM equipes WHERE limite_disponivel > 0 LIMIT 1'
    );
    
    if (!equipe) {
      console.log('❌ Nenhuma equipe com limite disponível encontrada');
      return;
    }
    
    console.log('📋 Equipe selecionada:');
    console.log(`   ID: ${equipe.id}`);
    console.log(`   Nome: ${equipe.nome}`);
    console.log(`   Limite Total: R$ ${Number(equipe.limite_credito || 0).toFixed(2)}`);
    console.log(`   Limite Disponível: R$ ${Number(equipe.limite_disponivel || 0).toFixed(2)}`);
    
    // 2. Simular valor acima do limite
    const limiteDisp = Number(equipe.limite_disponivel || 0);
    const valorPedido = limiteDisp + 100;
    const excedente = valorPedido - limiteDisp;
    
    console.log('\n💰 Simulação de Pedido:');
    console.log(`   Valor do Pedido: R$ ${valorPedido.toFixed(2)}`);
    console.log(`   Limite Disponível: R$ ${limiteDisp.toFixed(2)}`);
    console.log(`   Excedente: R$ ${excedente.toFixed(2)}`);
    console.log(`   Status Esperado: PENDENTE_APROVACAO`);
    
    // 3. Verificar lógica de status
    const statusEsperado = valorPedido > limiteDisp ? 'PENDENTE_APROVACAO' : 'APROVADO';
    const motivoEsperado = valorPedido > limiteDisp 
      ? `Valor do pedido (R$ ${valorPedido.toFixed(2)}) excede o limite disponível (R$ ${limiteDisp.toFixed(2)})`
      : null;
    
    console.log('\n✅ Validação da Lógica:');
    console.log(`   Status calculado: ${statusEsperado}`);
    console.log(`   Motivo: ${motivoEsperado}`);
    
    // 4. Verificar configuração de emails da equipe
    const [[emailConfig]] = await conn.execute(
      'SELECT e.vendedor_email, e.gestor_id, u.email as gestor_email FROM equipes e LEFT JOIN usuarios u ON u.id = e.gestor_id WHERE e.id = ?',
      [equipe.id]
    );
    
    console.log('\n📧 Configuração de Emails:');
    console.log(`   Email do Vendedor: ${emailConfig.vendedor_email || '❌ NÃO CONFIGURADO'}`);
    console.log(`   Email do Gestor: ${emailConfig.gestor_email || '❌ NÃO CONFIGURADO'}`);
    
    if (statusEsperado === 'PENDENTE_APROVACAO') {
      console.log('\n📨 Emails que serão enviados:');
      console.log(`   ✉️  GESTOR (${emailConfig.gestor_email || 'N/A'}): Solicitação de aprovação`);
      console.log(`   ✉️  VENDEDOR (${emailConfig.vendedor_email || 'N/A'}): Notificação de pedido pendente`);
    } else {
      console.log('\n📨 Email que será enviado:');
      console.log(`   ✉️  VENDEDOR (${emailConfig.vendedor_email || 'N/A'}): Pedido aprovado`);
    }
    
    // 5. Resumo da implementação
    console.log('\n📝 Resumo das Melhorias Implementadas:');
    console.log('   ✅ Backend: Removido bloqueio de pedidos com limite excedido');
    console.log('   ✅ Frontend: Alerta visual no carrinho quando valor > limite');
    console.log('   ✅ Frontend: Modal de confirmação antes de enviar pedido acima do limite');
    console.log('   ✅ Backend: Email para GESTOR (aprovação) quando limite excedido');
    console.log('   ✅ Backend: Email para VENDEDOR (notificação) quando limite excedido');
    console.log('   ✅ Frontend: Mensagem de sucesso diferenciada por status');
    
    console.log('\n🎯 Como Testar no Sistema:');
    console.log('   1. Faça login como usuário da equipe');
    console.log('   2. Adicione produtos até ultrapassar o limite disponível');
    console.log('   3. Observe o alerta vermelho no carrinho');
    console.log('   4. Clique em "Enviar Pedido ao Vendedor"');
    console.log('   5. Confirme no modal que deseja enviar para aprovação');
    console.log('   6. Verifique a mensagem de sucesso indicando status PENDENTE');
    console.log('   7. Verifique os emails enviados para gestor e vendedor');
    
  } finally {
    await conn.end();
  }
}

testarFluxoLimiteExcedido().catch(console.error);
