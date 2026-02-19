const mysql = require('mysql2/promise');
require('dotenv').config();

async function adicionarCampoPodeEditarEquipes() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'nexus_b2b',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('📋 Verificando se a coluna pode_editar_equipes já existe...');
    
    // Verificar se a coluna já existe
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'usuarios' 
       AND COLUMN_NAME = 'pode_editar_equipes'`,
      [process.env.DB_NAME || 'nexus_b2b']
    );

    if (columns.length > 0) {
      console.log('✅ Coluna pode_editar_equipes já existe!');
      await pool.end();
      return;
    }

    console.log('➕ Adicionando coluna pode_editar_equipes na tabela usuarios...');
    
    await pool.execute(`
      ALTER TABLE usuarios 
      ADD COLUMN pode_editar_equipes TINYINT(1) DEFAULT 0 
      COMMENT 'Permissão para editar informações de equipes'
    `);

    console.log('✅ Coluna pode_editar_equipes adicionada com sucesso!');

    // Atualizar administradores para terem permissão por padrão
    console.log('🔧 Habilitando permissão para editar equipes em todos os administradores...');
    
    const [result] = await pool.execute(`
      UPDATE usuarios 
      SET pode_editar_equipes = 1 
      WHERE perfil = 'admin'
    `);

    console.log(`✅ ${result.affectedRows} administrador(es) habilitado(s) para editar equipes`);

    // Verificar estrutura final
    console.log('\n📊 Estrutura da tabela usuarios após modificação:');
    const [describe] = await pool.execute('DESCRIBE usuarios');
    console.table(describe);

    await pool.end();
    console.log('\n✅ Script concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

adicionarCampoPodeEditarEquipes();
