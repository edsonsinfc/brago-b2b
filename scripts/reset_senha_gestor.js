require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db.mysql');

async function resetSenhaGestor() {
  try {
    console.log('🔄 Resetando senha do gestor...\n');
    
    const email = 'assistente.ti@bragodistribuidora.com.br';
    const novaSenha = '123456';
    
    // Verificar se usuário existe
    const [users] = await pool.execute('SELECT id, nome, perfil FROM usuarios WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log('❌ Usuário não encontrado com email:', email);
      process.exit(1);
    }
    
    const user = users[0];
    console.log('✅ Usuário encontrado:');
    console.log('   ID:', user.id);
    console.log('   Nome:', user.nome);
    console.log('   Perfil:', user.perfil);
    console.log('');
    
    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    
    // Atualizar senha
    await pool.execute('UPDATE usuarios SET senha = ?, ativo = 1 WHERE id = ?', [senhaHash, user.id]);
    
    console.log('✅ Senha resetada com sucesso!\n');
    console.log('📋 Dados para login:');
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', novaSenha);
    console.log('');
    console.log('🌐 Acesse: http://localhost:3100/login.html');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    process.exit(1);
  }
}

resetSenhaGestor();
