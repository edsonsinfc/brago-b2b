const mysql = require('mysql2/promise');

async function resetarSistema() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('🔄 Iniciando reset do sistema...\n');
    
    // 1. Contar pedidos antes de deletar
    const [countPedidos] = await conn.execute('SELECT COUNT(*) as total FROM pedidos');
    console.log(`📊 Pedidos existentes: ${countPedidos[0].total}`);
    
    // 2. Deletar todos os pedidos
    await conn.execute('DELETE FROM pedidos');
    console.log('✅ Todos os pedidos foram deletados\n');
    
    // 3. Contar equipes
    const [equipes] = await conn.execute('SELECT COUNT(*) as total FROM equipes');
    console.log(`📊 Total de equipes: ${equipes[0].total}`);
    
    // 4. Resetar limite de crédito e disponível para R$1000 em todas as equipes
    await conn.execute('UPDATE equipes SET limite_credito = 1000.00, limite_disponivel = 1000.00');
    console.log('✅ Limite de crédito e disponível de todas as equipes resetado para R$ 1.000,00\n');
    
    // 5. Verificar resultado
    const [equipesAtualizadas] = await conn.execute(`
      SELECT id, nome, limite_credito, limite_disponivel 
      FROM equipes 
      ORDER BY nome
    `);
    
    console.log('📋 Equipes atualizadas:');
    console.log('┌─────┬──────────────────────────────────┬─────────────────┬─────────────────┐');
    console.log('│ ID  │ Nome                             │ Limite Total    │ Disponível      │');
    console.log('├─────┼──────────────────────────────────┼─────────────────┼─────────────────┤');
    
    equipesAtualizadas.forEach(equipe => {
      const id = String(equipe.id).padEnd(3);
      const nome = String(equipe.nome || '').substring(0, 32).padEnd(32);
      const limite = `R$ ${parseFloat(equipe.limite_credito).toFixed(2)}`.padStart(13);
      const disponivel = `R$ ${parseFloat(equipe.limite_disponivel).toFixed(2)}`.padStart(13);
      console.log(`│ ${id} │ ${nome} │ ${limite}   │ ${disponivel}   │`);
    });
    
    console.log('└─────┴──────────────────────────────────┴─────────────────┴─────────────────┘');
    
    console.log('\n✨ Sistema resetado com sucesso!');
    console.log('   • Todos os pedidos deletados');
    console.log('   • Todas as equipes com R$ 1.000,00 de crédito');
    console.log('\n🚀 Sistema pronto para entrega!');
    
  } catch (error) {
    console.error('❌ Erro ao resetar sistema:', error.message);
  } finally {
    await conn.end();
  }
}

resetarSistema();
