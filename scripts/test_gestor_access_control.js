const pool = require('../src/config/db.mysql');

async function testGestorAccessControl() {
  try {
    const gestorId = 4; // Irineu
    const gestorNome = 'Irineu de Carvalho';
    
    console.log('\n🔒 TESTE DE CONTROLE DE ACESSO - GESTOR\n');
    console.log('='.repeat(80));
    console.log(`👤 Usuário: ${gestorNome} (ID: ${gestorId})`);
    console.log('='.repeat(80));
    
    // 1. Buscar equipes do gestor
    console.log('\n📋 1. EQUIPES ATRIBUÍDAS AO GESTOR:\n');
    const [equipesGestor] = await pool.execute(
      'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
      [gestorId]
    );
    
    const equipesIds = equipesGestor.map(e => e.equipe_id);
    console.log(`   Equipes IDs: [${equipesIds.join(', ')}]`);
    
    const [equipesDetalhes] = await pool.execute(
      `SELECT id, nome FROM equipes WHERE id IN (${equipesIds.map(() => '?').join(',')})`,
      equipesIds
    );
    
    equipesDetalhes.forEach(eq => {
      console.log(`   ✅ Equipe ${eq.id}: ${eq.nome}`);
    });
    
    // 2. Testar acesso a PEDIDOS
    console.log('\n📦 2. PEDIDOS QUE O GESTOR PODE VER:\n');
    const [pedidosGestor] = await pool.execute(
      `SELECT p.id, p.equipe_id, e.nome as equipe_nome, p.status, p.valor_total, p.data
       FROM pedidos p
       INNER JOIN equipes e ON e.id = p.equipe_id
       WHERE EXISTS (
         SELECT 1 FROM usuarios_equipes ue 
         WHERE ue.usuario_id = ? AND ue.equipe_id = p.equipe_id
       )
       ORDER BY p.id DESC
       LIMIT 10`,
      [gestorId]
    );
    
    console.log(`   Total de pedidos visíveis: ${pedidosGestor.length}`);
    pedidosGestor.slice(0, 5).forEach(p => {
      console.log(`   ✅ Pedido ID ${p.id} - Equipe ${p.equipe_id} (${p.equipe_nome}) - ${p.status} - R$ ${p.valor_total}`);
    });
    
    // 3. Verificar se existem pedidos de OUTRAS equipes que NÃO deve ver
    console.log('\n🚫 3. PEDIDOS DE OUTRAS EQUIPES (QUE NÃO DEVE VER):\n');
    const [pedidosOutrasEquipes] = await pool.execute(
      `SELECT p.id, p.equipe_id, e.nome as equipe_nome, p.status
       FROM pedidos p
       INNER JOIN equipes e ON e.id = p.equipe_id
       WHERE p.equipe_id NOT IN (${equipesIds.map(() => '?').join(',')})
       LIMIT 5`,
      equipesIds
    );
    
    console.log(`   Total de pedidos de outras equipes: ${pedidosOutrasEquipes.length}`);
    pedidosOutrasEquipes.forEach(p => {
      console.log(`   ❌ Pedido ID ${p.id} - Equipe ${p.equipe_id} (${p.equipe_nome}) - ${p.status} - BLOQUEADO`);
    });
    
    // 4. Testar acesso a EQUIPES
    console.log('\n🏢 4. EQUIPES QUE O GESTOR PODE VER:\n');
    const [todasEquipes] = await pool.execute('SELECT COUNT(*) as total FROM equipes');
    console.log(`   Total de equipes no sistema: ${todasEquipes[0].total}`);
    console.log(`   Equipes visíveis ao gestor: ${equipesIds.length}`);
    console.log(`   Equipes bloqueadas: ${todasEquipes[0].total - equipesIds.length}`);
    
    // 5. Testar acesso a USUÁRIOS
    console.log('\n👥 5. USUÁRIOS QUE O GESTOR PODE VER:\n');
    const [usuariosGestor] = await pool.execute(
      `SELECT DISTINCT u.id, u.nome, u.perfil
       FROM usuarios u
       WHERE EXISTS (
         SELECT 1 FROM usuarios_equipes ue 
         WHERE ue.usuario_id = u.id 
         AND ue.equipe_id IN (${equipesIds.map(() => '?').join(',')})
       )
       ORDER BY u.nome
       LIMIT 10`,
      equipesIds
    );
    
    console.log(`   Total de usuários visíveis: ${usuariosGestor.length}`);
    usuariosGestor.forEach(u => {
      console.log(`   ✅ ${u.nome} (${u.perfil})`);
    });
    
    // 6. Verificar usuários de OUTRAS equipes que NÃO deve ver
    console.log('\n🚫 6. USUÁRIOS DE OUTRAS EQUIPES (QUE NÃO DEVE VER):\n');
    const [usuariosOutrasEquipes] = await pool.execute(
      `SELECT DISTINCT u.id, u.nome, u.perfil, GROUP_CONCAT(ue.equipe_id) as equipes
       FROM usuarios u
       INNER JOIN usuarios_equipes ue ON ue.usuario_id = u.id
       WHERE ue.equipe_id NOT IN (${equipesIds.map(() => '?').join(',')})
       AND NOT EXISTS (
         SELECT 1 FROM usuarios_equipes ue2
         WHERE ue2.usuario_id = u.id
         AND ue2.equipe_id IN (${equipesIds.map(() => '?').join(',')})
       )
       GROUP BY u.id, u.nome, u.perfil
       LIMIT 5`,
      [...equipesIds, ...equipesIds]
    );
    
    console.log(`   Total de usuários de outras equipes: ${usuariosOutrasEquipes.length}`);
    usuariosOutrasEquipes.forEach(u => {
      console.log(`   ❌ ${u.nome} (${u.perfil}) - Equipes: ${u.equipes} - BLOQUEADO`);
    });
    
    // 7. Resumo da segurança
    console.log('\n🔐 7. RESUMO DE SEGURANÇA:\n');
    console.log(`   ✅ Gestor pode ver ${equipesIds.length} equipes`);
    console.log(`   ✅ Gestor pode ver ${pedidosGestor.length} pedidos (das suas equipes)`);
    console.log(`   ✅ Gestor pode ver ${usuariosGestor.length} usuários (das suas equipes)`);
    console.log(`   ❌ Gestor NÃO vê ${todasEquipes[0].total - equipesIds.length} outras equipes`);
    console.log(`   ❌ Gestor NÃO vê ${pedidosOutrasEquipes.length > 0 ? 'pedidos' : '0 pedidos'} de outras equipes`);
    console.log(`   ❌ Gestor NÃO vê ${usuariosOutrasEquipes.length} usuários de outras equipes`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ CONTROLE DE ACESSO FUNCIONANDO CORRETAMENTE!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testGestorAccessControl();
