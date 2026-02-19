/**
 * Script para verificar quais solicitantes cada gestor pode visualizar
 * Usado para testar o filtro de solicitantes no dashboard do gestor
 */

const pool = require('../src/config/db.mysql');

async function verificarSolicitantesGestores() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  VERIFICAÇÃO DE SOLICITANTES DISPONÍVEIS PARA CADA GESTOR');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Buscar todos os gestores ativos
    const [gestores] = await pool.execute(`
      SELECT id, nome, email 
      FROM usuarios 
      WHERE perfil = 'gestor' AND ativo = 1
      ORDER BY nome
    `);

    if (gestores.length === 0) {
      console.log('❌ Nenhum gestor ativo encontrado');
      return;
    }

    console.log(`📊 Total de gestores ativos: ${gestores.length}\n`);

    for (const gestor of gestores) {
      console.log(`\n┌─────────────────────────────────────────────────────────────`);
      console.log(`│ 👤 GESTOR: ${gestor.nome}`);
      console.log(`│ 📧 Email: ${gestor.email}`);
      console.log(`└─────────────────────────────────────────────────────────────`);

      // Buscar equipes que o gestor gerencia
      const [equipesGestor] = await pool.execute(`
        SELECT e.id, e.nome 
        FROM equipes e
        INNER JOIN usuarios_equipes ue ON ue.equipe_id = e.id
        WHERE ue.usuario_id = ?
        ORDER BY e.nome
      `, [gestor.id]);

      if (equipesGestor.length === 0) {
        console.log('  ⚠️  Gestor não está vinculado a nenhuma equipe');
        continue;
      }

      console.log(`\n  🏢 Equipes gerenciadas: ${equipesGestor.length}`);
      equipesGestor.forEach(eq => {
        console.log(`    - ${eq.nome} (ID: ${eq.id})`);
      });

      // Buscar solicitantes das equipes que o gestor gerencia
      const equipesIds = equipesGestor.map(e => e.id);
      const placeholders = equipesIds.map(() => '?').join(',');
      
      const [solicitantes] = await pool.execute(`
        SELECT DISTINCT u.id, u.nome, u.email, u.categoria_acesso
        FROM usuarios u
        INNER JOIN usuarios_equipes ue ON ue.usuario_id = u.id
        WHERE u.perfil = 'solicitante' 
          AND u.ativo = 1
          AND ue.equipe_id IN (${placeholders})
        ORDER BY u.nome
      `, equipesIds);

      console.log(`\n  👥 Solicitantes visíveis: ${solicitantes.length}`);
      
      if (solicitantes.length === 0) {
        console.log('    ⚠️  Nenhum solicitante ativo nas equipes deste gestor');
      } else {
        // Agrupar por categoria
        const facility = solicitantes.filter(s => s.categoria_acesso === 'facility');
        const manipulacao = solicitantes.filter(s => s.categoria_acesso === 'manipulacao');
        const ambas = solicitantes.filter(s => s.categoria_acesso === 'ambas');

        if (facility.length > 0) {
          console.log(`\n    🏭 FACILITY (${facility.length}):`);
          facility.forEach(s => {
            console.log(`      - ${s.nome} (${s.email})`);
          });
        }

        if (manipulacao.length > 0) {
          console.log(`\n    💊 MANIPULAÇÃO (${manipulacao.length}):`);
          manipulacao.forEach(s => {
            console.log(`      - ${s.nome} (${s.email})`);
          });
        }

        if (ambas.length > 0) {
          console.log(`\n    🔀 AMBAS (${ambas.length}):`);
          ambas.forEach(s => {
            console.log(`      - ${s.nome} (${s.email})`);
          });
        }
      }

      // Verificar pedidos recentes desses solicitantes
      if (solicitantes.length > 0) {
        const solicitantesIds = solicitantes.map(s => s.id);
        const solicitantesPlaceholders = solicitantesIds.map(() => '?').join(',');
        
        const [pedidos] = await pool.execute(`
          SELECT 
            COUNT(DISTINCT p.id) as total_pedidos,
            u.nome as solicitante_nome
          FROM pedidos p
          INNER JOIN usuarios u ON u.id = p.criado_por
          WHERE p.criado_por IN (${solicitantesPlaceholders})
            AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY p.criado_por, u.nome
          ORDER BY total_pedidos DESC
        `, solicitantesIds);

        if (pedidos.length > 0) {
          console.log(`\n  📦 Pedidos nos últimos 30 dias:`);
          pedidos.forEach(p => {
            console.log(`    - ${p.solicitante_nome}: ${p.total_pedidos} pedido(s)`);
          });
        }
      }

      console.log('');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ VERIFICAÇÃO CONCLUÍDA');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Erro ao verificar solicitantes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar verificação
verificarSolicitantesGestores().catch(console.error);
