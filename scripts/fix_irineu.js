const pool = require('../src/config/db.mysql');

async function fixIrineu() {
  const conn = await pool.getConnection();
  
  try {
    // Atualizar com SET NAMES utf8mb4 primeiro
    await conn.query('SET NAMES utf8mb4');
    
    // Atualizar o nome do Irineu
    await conn.query("UPDATE usuarios SET nome = ? WHERE id = 4", ['Irineu de Carvalho']);
    console.log('✅ Nome do Irineu atualizado');
    
    // Verificar
    const [users] = await conn.query('SELECT id, nome, email FROM usuarios WHERE id = 4');
    console.log('Resultado:', users[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    conn.release();
    process.exit();
  }
}

fixIrineu();
