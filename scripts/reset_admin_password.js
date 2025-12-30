require('dotenv').config();
const pool = require('../src/config/db.mysql');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
  try {
    console.log('🔧 Resetando senha do admin...\n');
    
    const novaSenha = 'admin123';
    const hash = await bcrypt.hash(novaSenha, 10);
    
    await pool.execute('UPDATE usuarios SET senha = ? WHERE email = ?', [hash, 'admin@local']);
    
    console.log('✅ Senha do admin@local resetada para: admin123');
    
    // Verificar
    const [result] = await pool.execute('SELECT senha FROM usuarios WHERE email = ?', ['admin@local']);
    const senhaOk = await bcrypt.compare(novaSenha, result[0].senha);
    
    console.log(`\n🔍 Verificação: ${senhaOk ? '✅ Senha correta' : '❌ Erro ao verificar'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

resetAdmin();
