const pool = require('../src/config/db.mysql');

async function fixManually() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔧 Corrigindo manualmente...');
    
    // Atualizar diretamente com os valores corretos
    await conn.query(`UPDATE usuarios SET nome = 'Irineu de Carvalho' WHERE nome LIKE '%Irine%'`);
    console.log('✅ Nome do Irineu corrigido');
    
    await conn.query(`UPDATE equipes SET nome = 'ARAUCÁRIAS' WHERE nome LIKE '%ARAUC%RIAS%'`);
    console.log('✅ Nome da equipe ARAUCÁRIAS corrigido');
    
    // Listar usuários para confirmar
    const [users] = await conn.query('SELECT id, nome, email FROM usuarios');
    console.log('\n📋 Usuários no banco:');
    users.forEach(u => console.log(`  ${u.id}: ${u.nome} (${u.email})`));
    
    console.log('\n🎉 Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    conn.release();
    process.exit();
  }
}

fixManually();
