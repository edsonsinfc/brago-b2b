// Script para verificar resultado da migração
const mysql = require('mysql2/promise');

async function verificarMigracao() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('\n📊 VERIFICAÇÃO PÓS-MIGRAÇÃO\n');
    console.log('='.repeat(80));

    // Verificar se as equipes antigas foram removidas
    const equipesRemovidas = [20, 22, 19];
    console.log('\n✅ EQUIPES REMOVIDAS:');
    for (const id of equipesRemovidas) {
      const [equipe] = await connection.execute('SELECT * FROM equipes WHERE id = ?', [id]);
      if (equipe.length === 0) {
        console.log(`   ✅ Equipe #${id} foi removida com sucesso`);
      } else {
        console.log(`   ❌ ERRO: Equipe #${id} ainda existe!`);
      }
    }

    // Verificar se as equipes mantidas ainda existem
    const equipesMap = [
      { id: 34, nome: 'QI 09' },
      { id: 35, nome: 'COLORADO' },
      { id: 33, nome: '302 SUDOESTE' }
    ];

    console.log('\n✅ EQUIPES MANTIDAS:');
    for (const { id, nome } of equipesMap) {
      const [equipe] = await connection.execute('SELECT * FROM equipes WHERE id = ?', [id]);
      if (equipe.length > 0) {
        console.log(`   ✅ Equipe #${id} - ${equipe[0].nome}`);
        
        // Verificar usuários vinculados
        const [usuarios] = await connection.execute(`
          SELECT COUNT(*) as total 
          FROM usuarios_equipes 
          WHERE equipe_id = ?
        `, [id]);
        console.log(`      👥 Usuários: ${usuarios[0].total}`);
      } else {
        console.log(`   ❌ ERRO: Equipe #${id} não encontrada!`);
      }
    }

    // Verificar total de equipes
    const [totalEquipes] = await connection.execute('SELECT COUNT(*) as total FROM equipes');
    console.log(`\n📋 TOTAL DE EQUIPES NO SISTEMA: ${totalEquipes[0].total}`);

    // Listar todas as equipes restantes
    const [equipes] = await connection.execute('SELECT id, nome FROM equipes ORDER BY nome');
    console.log('\n📋 LISTA DE TODAS AS EQUIPES:');
    equipes.forEach((equipe, index) => {
      console.log(`   ${index + 1}. #${equipe.id} - ${equipe.nome}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICAÇÃO CONCLUÍDA!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

verificarMigracao();
