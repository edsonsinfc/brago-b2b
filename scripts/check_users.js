require('dotenv').config();
const pool = require('../src/config/db.mysql');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  try {
    console.log('📋 Verificando usuários no banco...\n');
    
    const [users] = await pool.execute('SELECT id, nome, email, perfil, ativo FROM usuarios');
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado!');
      return;
    }
    
    console.log(`✅ ${users.length} usuário(s) encontrado(s):\n`);
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Nome: ${user.nome}`);
      console.log(`Email: ${user.email}`);
      console.log(`Perfil: ${user.perfil}`);
      console.log(`Ativo: ${user.ativo}`);
      console.log('---');
    });
    
    // Testar senha
    console.log('\n🔑 Testando senha "admin123" para admin@local...');
    const [adminUser] = await pool.execute('SELECT senha FROM usuarios WHERE email = ?', ['admin@local']);
    
    if (adminUser.length > 0) {
      const hashArmazenado = adminUser[0].senha;
      const senhaCorreta = await bcrypt.compare('admin123', hashArmazenado);
      console.log(`Hash armazenado: ${hashArmazenado.substring(0, 30)}...`);
      console.log(`Senha válida: ${senhaCorreta ? '✅ SIM' : '❌ NÃO'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkUsers();
