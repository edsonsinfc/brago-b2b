require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function checkAllUsers() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, perfil, categoria_acesso, equipe_id FROM usuarios ORDER BY id'
    );
    
    console.log('📋 Todos os usuários:');
    console.table(rows);
    
    // Verificar quais têm perfil vazio ou NULL
    const semPerfil = rows.filter(u => !u.perfil || u.perfil === '');
    console.log('\n⚠️ Usuários sem perfil definido:', semPerfil.length);
    semPerfil.forEach(u => console.log(`  - ID ${u.id}: ${u.nome}`));
    
    // Verificar quais solicitantes não têm categoria
    const solicitantesSemCategoria = rows.filter(u => u.perfil === 'solicitante' && !u.categoria_acesso);
    console.log('\n⚠️ Solicitantes sem categoria:', solicitantesSemCategoria.length);
    solicitantesSemCategoria.forEach(u => console.log(`  - ID ${u.id}: ${u.nome}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkAllUsers();
