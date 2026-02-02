// Script para verificar usuários administradores e suas permissões
const mysql = require('mysql2/promise');

async function checkAdminUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('\n🔍 VERIFICANDO USUÁRIOS ADMINISTRADORES...\n');
    
    // Buscar todos os usuários admin
    const [admins] = await connection.execute(`
      SELECT id, nome, email, perfil, ativo, primeiro_login
      FROM usuarios
      WHERE perfil = 'admin'
      ORDER BY id
    `);

    console.log('📋 TOTAL DE ADMINISTRADORES:', admins.length);
    console.log('─'.repeat(80));
    
    if (admins.length === 0) {
      console.log('❌ NENHUM ADMINISTRADOR ENCONTRADO!');
      console.log('\n💡 Criando usuário administrador padrão...\n');
      
      const bcrypt = require('bcrypt');
      const senhaHash = await bcrypt.hash('admin123', 10);
      
      await connection.execute(`
        INSERT INTO usuarios (nome, email, senha, perfil, ativo, primeiro_login)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['Administrador', 'admin@brago.com.br', senhaHash, 'admin', 1, 0]);
      
      console.log('✅ Usuário administrador criado com sucesso!');
      console.log('   Email: admin@brago.com.br');
      console.log('   Senha: admin123');
      console.log('   Perfil: admin');
    } else {
      admins.forEach((admin, index) => {
        console.log(`\n${index + 1}. ID: ${admin.id}`);
        console.log(`   Nome: ${admin.nome}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Perfil: ${admin.perfil} ${admin.perfil === 'admin' ? '✅' : '❌'}`);
        console.log(`   Ativo: ${admin.ativo ? '✅ Sim' : '❌ Não'}`);
        console.log(`   Primeiro Login: ${admin.primeiro_login ? '⚠️ Sim' : '✅ Não'}`);
      });
      
      console.log('\n' + '─'.repeat(80));
      console.log('\n✅ Todos os administradores estão configurados corretamente!');
    }
    
    // Verificar se há usuários com perfil incorreto que deveriam ser admin
    const [gestores] = await connection.execute(`
      SELECT id, nome, email, perfil
      FROM usuarios
      WHERE perfil = 'gestor' AND email LIKE '%admin%'
    `);
    
    if (gestores.length > 0) {
      console.log('\n⚠️  ATENÇÃO! Usuários com email "admin" mas perfil "gestor":');
      gestores.forEach(g => {
        console.log(`   - ${g.nome} (${g.email}) - ID: ${g.id}`);
      });
      console.log('\n💡 Você pode querer atualizar esses usuários para perfil "admin"');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdminUsers();
