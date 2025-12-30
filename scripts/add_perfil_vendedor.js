const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nexus_b2b'
});

async function addVendedorProfile() {
  try {
    console.log('🔄 Adicionando perfil VENDEDOR na tabela usuarios...');
    
    await pool.execute(`
      ALTER TABLE usuarios 
      MODIFY COLUMN perfil ENUM('admin', 'gestor', 'equipe', 'vendedor') NOT NULL
    `);
    
    console.log('✅ Perfil VENDEDOR adicionado com sucesso!');
    console.log('✅ Agora é possível criar usuários com perfil "vendedor"');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar perfil:', error.message);
    process.exit(1);
  }
}

addVendedorProfile();
