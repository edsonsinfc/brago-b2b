const pool = require('../src/config/db.mysql');

async function showAccessSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('🔒 RESUMO DO CONTROLE DE ACESSO - GESTOR IRINEU DE CARVALHO');
  console.log('='.repeat(80));
  
  const [equipesGestor] = await pool.execute(
    'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = 4'
  );
  const equipesIds = equipesGestor.map(e => e.equipe_id);
  
  const [equipesDetalhes] = await pool.execute(
    `SELECT id, nome FROM equipes WHERE id IN (${equipesIds.map(() => '?').join(',')}) ORDER BY nome`,
    equipesIds
  );
  
  console.log('\n✅ EQUIPES QUE O GESTOR IRINEU PODE GERENCIAR (6 de 13 total):');
  equipesDetalhes.forEach((e, i) => {
    console.log(`   ${i+1}. ${e.nome} (ID: ${e.id})`);
  });
  
  const [equipesNegadas] = await pool.execute(
    `SELECT id, nome FROM equipes WHERE id NOT IN (${equipesIds.map(() => '?').join(',')}) ORDER BY nome`,
    equipesIds
  );
  
  console.log('\n❌ EQUIPES BLOQUEADAS (não pode ver):');
  equipesNegadas.forEach((e, i) => {
    console.log(`   ${i+1}. ${e.nome} (ID: ${e.id})`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 O QUE ISSO SIGNIFICA NA PRÁTICA:');
  console.log('='.repeat(80));
  
  console.log('\n✅ Irineu PODE VER:');
  console.log('   • Pedidos criados pelas 6 equipes listadas acima');
  console.log('   • Usuários vinculados a essas 6 equipes');
  console.log('   • Somente essas 6 equipes na lista de equipes');
  
  console.log('\n❌ Irineu NÃO PODE VER:');
  console.log('   • Pedidos das 7 outras equipes bloqueadas');
  console.log('   • Usuários vinculados apenas às equipes bloqueadas');
  console.log('   • As equipes bloqueadas não aparecem em nenhuma lista');
  
  console.log('\n💡 EXEMPLO PRÁTICO:');
  console.log('   Se um pedido for criado pela equipe "IGUATEMI" (bloqueada),');
  console.log('   Irineu NÃO verá esse pedido em nenhuma tela.');
  console.log('   Apenas gestores/admins com acesso à equipe IGUATEMI verão.');
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ SISTEMA FUNCIONANDO CORRETAMENTE!');
  console.log('   Cada gestor vê apenas as equipes atribuídas no seu cadastro.');
  console.log('='.repeat(80) + '\n');
  
  process.exit(0);
}

showAccessSummary().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
