const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function criarUsuarioGestor() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });
  
  try {
    console.log('🔧 Criando usuário GESTOR de teste...\n');
    
    const senhaHash = await bcrypt.hash('123456', 10);
    
    // Verificar se já existe
    const [existing] = await conn.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      ['gestor@teste.com']
    );
    
    if (existing.length > 0) {
      console.log('⚠️  Usuário já existe! Atualizando...');
      await conn.execute(
        'UPDATE usuarios SET perfil = ?, senha = ?, ativo = 1 WHERE email = ?',
        ['gestor', senhaHash, 'gestor@teste.com']
      );
    } else {
      await conn.execute(
        'INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES (?, ?, ?, ?, ?)',
        ['Gestor Comercial', 'gestor@teste.com', senhaHash, 'gestor', 1]
      );
    }
    
    console.log('✅ Usuário GESTOR criado/atualizado com sucesso!\n');
    
    // Listar todos usuários
    const [usuarios] = await conn.execute(
      'SELECT id, nome, email, perfil, ativo FROM usuarios ORDER BY id'
    );
    
    console.log('📊 Usuários cadastrados:');
    console.log(''.padEnd(100, '='));
    console.log('ID | Nome                      | Email                              | Perfil  | Ativo');
    console.log(''.padEnd(100, '='));
    
    usuarios.forEach(u => {
      const status = u.ativo ? '✅' : '❌';
      console.log(
        `${String(u.id).padStart(2)} | ${u.nome.padEnd(25)} | ${u.email.padEnd(35)} | ${u.perfil.padEnd(7)} | ${status}`
      );
    });
    
    console.log(''.padEnd(100, '='));
    console.log('\n✅ Para testar o perfil GESTOR:');
    console.log('   📧 Email: gestor@teste.com');
    console.log('   🔑 Senha: 123456');
    console.log('\n📋 Permissões do GESTOR:');
    console.log('   ✅ Ver e gerenciar Pedidos');
    console.log('   ✅ Ver e gerenciar Equipes');
    console.log('   ✅ Ver e gerenciar Usuários');
    console.log('   ✅ Ver Notificações');
    console.log('   ❌ NÃO pode gerenciar Produtos');
    console.log('   ❌ NÃO vê progressão de entrega nos detalhes do pedido');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

criarUsuarioGestor().catch(console.error);
