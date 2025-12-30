require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function checkKamila() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, perfil, ativo, equipe_id, categoria_acesso FROM usuarios WHERE nome LIKE ? OR email LIKE ?',
      ['%kamila%', '%kamila%']
    );
    
    console.log('Usuários encontrados:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkKamila();
