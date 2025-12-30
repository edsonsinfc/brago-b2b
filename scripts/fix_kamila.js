require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function fixKamila() {
  try {
    console.log('🔧 Atualizando perfil da Kamila...');
    
    const [result] = await pool.execute(
      'UPDATE usuarios SET perfil = ?, categoria_acesso = ? WHERE id = ?',
      ['solicitante', 'ambas', 3]
    );
    
    console.log('Linhas afetadas:', result.affectedRows);
    
    const [rows] = await pool.execute(
      'SELECT id, nome, email, perfil, ativo, equipe_id, categoria_acesso FROM usuarios WHERE id = ?',
      [3]
    );
    
    console.log('\n✅ Dados atualizados:');
    console.log(rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

fixKamila();
