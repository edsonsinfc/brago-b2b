require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db.mysql');

async function criarVendedor() {
  try {
    console.log('🔄 Criando usuário vendedor...');
    
    const nome = 'Vendedor Teste';
    const email = 'vendedor@bragodistribuidora.com.br';
    const senha = '123456';
    const perfil = 'vendedor';
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    
    // Verificar se já existe
    const [existing] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
    
    if (existing.length > 0) {
      console.log('⚠️ Usuário vendedor já existe');
      console.log('📧 Email:', email);
      console.log('🔑 Senha:', senha);
      process.exit(0);
    }
    
    // Inserir usuário
    await pool.execute(
      'INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES (?, ?, ?, ?, 1)',
      [nome, email, senhaHash, perfil]
    );
    
    console.log('✅ Usuário vendedor criado com sucesso!');
    console.log('');
    console.log('📋 Dados para login:');
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', senha);
    console.log('');
    console.log('🌐 Acesse: http://localhost:3100/login.html');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar vendedor:', error);
    process.exit(1);
  }
}

criarVendedor();
