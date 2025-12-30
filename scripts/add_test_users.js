const bcrypt = require('bcryptjs');
const pool = require('../src/config/db.mysql');

async function addTestUsers() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('\n🧪 ADICIONANDO USUÁRIOS DE TESTE\n');
    console.log('='.repeat(80));
    
    // Buscar todas as lojas
    const [lojas] = await connection.execute('SELECT id FROM equipes');
    const lojasIds = lojas.map(l => l.id);
    
    console.log(`📋 Total de lojas: ${lojasIds.length}\n`);
    
    // Usuário 1: Gestor de todas equipes
    const senhaGestor = await bcrypt.hash('Mudar@123', 10);
    const [resultGestor] = await connection.execute(
      'INSERT INTO usuarios (nome, email, senha, perfil, ativo, equipe_id, categoria_acesso, recebe_email_notificacao) VALUES (?, ?, ?, ?, 1, ?, ?, 0)',
      ['Artes Brago', 'artes@bragodistribuidora.com.br', senhaGestor, 'gestor', lojasIds[0], null]
    );
    
    const gestorId = resultGestor.insertId;
    
    // Vincular a todas as lojas
    for (const lojaId of lojasIds) {
      await connection.execute(
        'INSERT INTO usuarios_equipes (usuario_id, equipe_id) VALUES (?, ?)',
        [gestorId, lojaId]
      );
    }
    
    console.log(`✅ GESTOR: Artes Brago`);
    console.log(`   Email: artes@bragodistribuidora.com.br`);
    console.log(`   Senha: Mudar@123`);
    console.log(`   Acesso: TODAS as ${lojasIds.length} lojas\n`);
    
    // Usuário 2: Solicitante com acesso a todas lojas
    const senhaSolicitante = await bcrypt.hash('Mudar@123', 10);
    const [resultSolicitante] = await connection.execute(
      'INSERT INTO usuarios (nome, email, senha, perfil, ativo, equipe_id, categoria_acesso, recebe_email_notificacao) VALUES (?, ?, ?, ?, 1, ?, ?, 0)',
      ['Brenan Art', 'brenan.art@gmail.com', senhaSolicitante, 'solicitante', lojasIds[0], 'facility']
    );
    
    const solicitanteId = resultSolicitante.insertId;
    
    // Vincular a todas as lojas
    for (const lojaId of lojasIds) {
      await connection.execute(
        'INSERT INTO usuarios_equipes (usuario_id, equipe_id) VALUES (?, ?)',
        [solicitanteId, lojaId]
      );
    }
    
    console.log(`✅ SOLICITANTE: Brenan Art`);
    console.log(`   Email: brenan.art@gmail.com`);
    console.log(`   Senha: Mudar@123`);
    console.log(`   Categoria: FACILITY`);
    console.log(`   Acesso: TODAS as ${lojasIds.length} lojas\n`);
    
    await connection.commit();
    
    console.log('='.repeat(80));
    console.log('\n✅ USUÁRIOS DE TESTE CRIADOS COM SUCESSO!\n');
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ ERRO:', error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

addTestUsers().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
