require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function fixIsabella() {
  try {
    console.log('🔧 Corrigindo perfil da Isabella...');
    
    // Isabella tem equipe_id, então deve ser solicitante
    await pool.execute(
      'UPDATE usuarios SET perfil = ?, categoria_acesso = ? WHERE id = ?',
      ['solicitante', 'ambas', 5]
    );
    
    console.log('✅ Isabella atualizada');
    
    const [rows] = await pool.execute(
      'SELECT id, nome, perfil, categoria_acesso FROM usuarios WHERE id = 5'
    );
    
    console.log('\n📋 Dados atualizados:');
    console.log(rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

fixIsabella();
