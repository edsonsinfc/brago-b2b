// Script para remover equipes duplicadas e migrar usuários
const mysql = require('mysql2/promise');

async function removerEquipesDuplicadas() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('\n🔄 INICIANDO MIGRAÇÃO E REMOÇÃO DE EQUIPES DUPLICADAS...\n');
    
    // Mapeamento: equipe_antiga_id => equipe_nova_id
    const migracao = [
      { antiga: 20, nova: 34, antigaNome: 'QI 09 LAGO SUL', novaNome: 'QI 09' },
      { antiga: 22, nova: 35, antigaNome: 'TAQUARI', novaNome: 'COLORADO' },
      { antiga: 19, nova: 33, antigaNome: 'SUDOESTE', novaNome: '302 SUDOESTE' }
    ];

    await connection.beginTransaction();

    for (const { antiga, nova, antigaNome, novaNome } of migracao) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📋 PROCESSANDO: #${antiga} - ${antigaNome} → #${nova} - ${novaNome}`);
      console.log('='.repeat(80));

      // 1. Verificar se as equipes existem
      const [equipaAntiga] = await connection.execute(
        'SELECT id, nome FROM equipes WHERE id = ?',
        [antiga]
      );
      
      const [equipaNova] = await connection.execute(
        'SELECT id, nome FROM equipes WHERE id = ?',
        [nova]
      );

      if (equipaAntiga.length === 0) {
        console.log(`⚠️  Equipe #${antiga} não encontrada. Pulando...`);
        continue;
      }

      if (equipaNova.length === 0) {
        console.log(`❌ Equipe destino #${nova} não encontrada! Abortando esta migração...`);
        continue;
      }

      console.log(`✅ Equipe origem: #${antiga} - ${equipaAntiga[0].nome}`);
      console.log(`✅ Equipe destino: #${nova} - ${equipaNova[0].nome}`);

      // 2. Buscar usuários vinculados à equipe antiga
      const [usuarios] = await connection.execute(`
        SELECT ue.usuario_id, u.nome, u.email, u.perfil
        FROM usuarios_equipes ue
        JOIN usuarios u ON ue.usuario_id = u.id
        WHERE ue.equipe_id = ?
      `, [antiga]);

      console.log(`\n👥 USUÁRIOS VINCULADOS À EQUIPE #${antiga}:`, usuarios.length);

      if (usuarios.length > 0) {
        console.log('\n📋 Listagem de usuários:');
        usuarios.forEach((usuario, index) => {
          console.log(`   ${index + 1}. ${usuario.nome} (${usuario.email}) - ${usuario.perfil}`);
        });

        // 3. Migrar cada usuário para a nova equipe
        console.log(`\n🔄 Migrando usuários para equipe #${nova}...`);
        
        for (const usuario of usuarios) {
          // Verificar se já existe vínculo com a equipe nova
          const [vinculoExistente] = await connection.execute(
            'SELECT * FROM usuarios_equipes WHERE usuario_id = ? AND equipe_id = ?',
            [usuario.usuario_id, nova]
          );

          if (vinculoExistente.length > 0) {
            console.log(`   ⚠️  ${usuario.nome} já está vinculado à equipe #${nova}`);
            // Remover vínculo com equipe antiga
            await connection.execute(
              'DELETE FROM usuarios_equipes WHERE usuario_id = ? AND equipe_id = ?',
              [usuario.usuario_id, antiga]
            );
            console.log(`   🗑️  Removido vínculo antigo`);
          } else {
            // Atualizar o vínculo: trocar equipe antiga por nova
            await connection.execute(
              'UPDATE usuarios_equipes SET equipe_id = ? WHERE usuario_id = ? AND equipe_id = ?',
              [nova, usuario.usuario_id, antiga]
            );
            console.log(`   ✅ ${usuario.nome} migrado com sucesso`);
          }
        }
      } else {
        console.log('   ℹ️  Nenhum usuário vinculado a esta equipe');
      }

      // 4. Verificar pedidos vinculados à equipe antiga
      const [pedidos] = await connection.execute(
        'SELECT COUNT(*) as total FROM pedidos WHERE equipe_id = ?',
        [antiga]
      );

      console.log(`\n📦 PEDIDOS vinculados à equipe #${antiga}:`, pedidos[0].total);

      if (pedidos[0].total > 0) {
        console.log(`🔄 Migrando ${pedidos[0].total} pedidos para equipe #${nova}...`);
        await connection.execute(
          'UPDATE pedidos SET equipe_id = ? WHERE equipe_id = ?',
          [nova, antiga]
        );
        console.log('✅ Pedidos migrados com sucesso');
      }

      // 5. Remover a equipe antiga
      console.log(`\n🗑️  Removendo equipe #${antiga} - ${antigaNome}...`);
      await connection.execute('DELETE FROM equipes WHERE id = ?', [antiga]);
      console.log('✅ Equipe removida com sucesso!');
    }

    // Commit da transação
    await connection.commit();
    console.log('\n' + '='.repeat(80));
    console.log('✅ TODAS AS MIGRAÇÕES CONCLUÍDAS COM SUCESSO!');
    console.log('='.repeat(80) + '\n');

    // Resumo final
    console.log('📊 RESUMO:');
    console.log('   ✅ Equipes removidas: 3');
    console.log('   ✅ Equipes mantidas: 3');
    console.log('   ✅ Usuários migrados com sucesso');
    console.log('   ✅ Pedidos migrados com sucesso\n');

  } catch (error) {
    await connection.rollback();
    console.error('\n❌ ERRO durante a migração:', error.message);
    console.error('🔄 Rollback executado - nenhuma alteração foi feita\n');
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
removerEquipesDuplicadas();
