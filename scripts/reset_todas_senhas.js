require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db.mysql');

async function resetarTodasSenhas() {
  try {
    console.log('🔄 Resetando senhas de todos os perfis...\n');
    
    const usuarios = [
      {
        email: 'admin.brago@bragodistribuidora.com.br',
        senha: 'admin123',
        perfil: 'admin'
      },
      {
        email: 'assistente.ti@bragodistribuidora.com.br',
        senha: '123456',
        perfil: 'gestor'
      },
      {
        email: 'vendedor@bragodistribuidora.com.br',
        senha: '123456',
        perfil: 'vendedor'
      },
      {
        email: 'edson.silva@bragodistribuidora.com.br',
        senha: '123456',
        perfil: 'equipe'
      }
    ];
    
    for (const usuario of usuarios) {
      // Verificar se usuário existe
      const [users] = await pool.execute(
        'SELECT id, nome, perfil FROM usuarios WHERE email = ?', 
        [usuario.email]
      );
      
      if (users.length === 0) {
        console.log(`⚠️  ${usuario.perfil.toUpperCase()} não encontrado: ${usuario.email}`);
        continue;
      }
      
      const user = users[0];
      
      // Hash da senha
      const senhaHash = await bcrypt.hash(usuario.senha, 10);
      
      // Atualizar senha e garantir que está ativo
      await pool.execute(
        'UPDATE usuarios SET senha = ?, ativo = 1 WHERE id = ?', 
        [senhaHash, user.id]
      );
      
      console.log(`✅ ${usuario.perfil.toUpperCase().padEnd(10)} - ${user.nome}`);
      console.log(`   📧 Email: ${usuario.email}`);
      console.log(`   🔑 Senha: ${usuario.senha}`);
      console.log('');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Todas as senhas foram resetadas!');
    console.log('🌐 Acesse: http://localhost:3100/login.html');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao resetar senhas:', error);
    process.exit(1);
  }
}

resetarTodasSenhas();
