const pool = require('../src/config/db.mysql');

async function testAccessDetailed() {
  try {
    const gestorId = 4; // Irineu
    
    console.log('\n🔍 ANÁLISE DETALHADA DE CONTROLE DE ACESSO\n');
    console.log('='.repeat(80));
    
    // Buscar equipes do gestor
    const [equipesGestor] = await pool.execute(
      'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
      [gestorId]
    );
    const equipesIds = equipesGestor.map(e => e.equipe_id);
    
    console.log(`👤 Gestor Irineu - Equipes: [${equipesIds.join(', ')}]\n`);
    
    // 1. Todos os pedidos no sistema
    const [todosPedidos] = await pool.execute(
      'SELECT id, equipe_id, status, valor_total FROM pedidos ORDER BY id DESC LIMIT 20'
    );
    
    console.log('📦 TODOS OS PEDIDOS NO SISTEMA (últimos 20):\n');
    todosPedidos.forEach(p => {
      const temAcesso = equipesIds.includes(p.equipe_id);
      const icone = temAcesso ? '✅' : '❌';
      const msg = temAcesso ? 'PODE VER' : 'BLOQUEADO';
      console.log(`   ${icone} Pedido ID ${p.id} - Equipe ${p.equipe_id} - ${p.status} - ${msg}`);
    });
    
    // 2. Todas as equipes
    const [todasEquipes] = await pool.execute(
      'SELECT id, nome FROM equipes ORDER BY nome'
    );
    
    console.log('\n🏢 TODAS AS EQUIPES NO SISTEMA:\n');
    todasEquipes.forEach(e => {
      const temAcesso = equipesIds.includes(e.id);
      const icone = temAcesso ? '✅' : '❌';
      const msg = temAcesso ? 'PODE VER' : 'BLOQUEADA';
      console.log(`   ${icone} Equipe ${e.id}: ${e.nome} - ${msg}`);
    });
    
    // 3. Todos os usuários
    const [todosUsuarios] = await pool.execute(
      `SELECT u.id, u.nome, u.perfil, GROUP_CONCAT(ue.equipe_id) as equipes_ids
       FROM usuarios u
       LEFT JOIN usuarios_equipes ue ON ue.usuario_id = u.id
       WHERE u.perfil != 'admin'
       GROUP BY u.id, u.nome, u.perfil
       ORDER BY u.nome`
    );
    
    console.log('\n👥 TODOS OS USUÁRIOS (exceto admin):\n');
    todosUsuarios.forEach(u => {
      if (!u.equipes_ids) {
        console.log(`   ⚠️  ${u.nome} (${u.perfil}) - Sem equipes - BLOQUEADO`);
        return;
      }
      
      const equipesUsuario = u.equipes_ids.split(',').map(Number);
      const temEquipeComum = equipesUsuario.some(eq => equipesIds.includes(eq));
      const icone = temEquipeComum ? '✅' : '❌';
      const msg = temEquipeComum ? 'PODE VER' : 'BLOQUEADO';
      console.log(`   ${icone} ${u.nome} (${u.perfil}) - Equipes: [${u.equipes_ids}] - ${msg}`);
    });
    
    // 4. Estatísticas
    console.log('\n📊 ESTATÍSTICAS:\n');
    
    const pedidosVisiveis = todosPedidos.filter(p => equipesIds.includes(p.equipe_id)).length;
    const pedidosBloqueados = todosPedidos.length - pedidosVisiveis;
    
    const equipesVisiveis = todasEquipes.filter(e => equipesIds.includes(e.id)).length;
    const equipesBloqueadas = todasEquipes.length - equipesVisiveis;
    
    const usuariosVisiveis = todosUsuarios.filter(u => {
      if (!u.equipes_ids) return false;
      const equipesUsuario = u.equipes_ids.split(',').map(Number);
      return equipesUsuario.some(eq => equipesIds.includes(eq));
    }).length;
    const usuariosBloqueados = todosUsuarios.length - usuariosVisiveis;
    
    console.log(`   Pedidos:`);
    console.log(`     ✅ Visíveis: ${pedidosVisiveis} (${(pedidosVisiveis/todosPedidos.length*100).toFixed(1)}%)`);
    console.log(`     ❌ Bloqueados: ${pedidosBloqueados} (${(pedidosBloqueados/todosPedidos.length*100).toFixed(1)}%)`);
    
    console.log(`\n   Equipes:`);
    console.log(`     ✅ Visíveis: ${equipesVisiveis}/${todasEquipes.length} (${(equipesVisiveis/todasEquipes.length*100).toFixed(1)}%)`);
    console.log(`     ❌ Bloqueadas: ${equipesBloqueadas}/${todasEquipes.length} (${(equipesBloqueadas/todasEquipes.length*100).toFixed(1)}%)`);
    
    console.log(`\n   Usuários:`);
    console.log(`     ✅ Visíveis: ${usuariosVisiveis}/${todosUsuarios.length} (${(usuariosVisiveis/todosUsuarios.length*100).toFixed(1)}%)`);
    console.log(`     ❌ Bloqueados: ${usuariosBloqueados}/${todosUsuarios.length} (${(usuariosBloqueados/todosUsuarios.length*100).toFixed(1)}%)`);
    
    console.log('\n' + '='.repeat(80));
    
    if (pedidosBloqueados > 0 || equipesBloqueadas > 0 || usuariosBloqueados > 0) {
      console.log('✅ CONTROLE DE ACESSO FUNCIONANDO - Há restrições ativas!\n');
    } else {
      console.log('⚠️  ATENÇÃO: Gestor tem acesso total - verificar configuração!\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testAccessDetailed();
