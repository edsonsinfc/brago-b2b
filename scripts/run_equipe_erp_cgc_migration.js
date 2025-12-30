const mysql = require('mysql2/promise');

async function runMigration() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });
  
  try {
    console.log('🚀 Adicionando campos Codigo_ERP e CGC na tabela equipes...\n');
    
    // Executar comandos SQL um por vez
    console.log('1️⃣ Adicionando coluna codigo_erp...');
    await conn.query('ALTER TABLE equipes ADD COLUMN codigo_erp VARCHAR(50) DEFAULT NULL AFTER nome');
    console.log('✅ Coluna codigo_erp adicionada\n');
    
    console.log('2️⃣ Adicionando coluna cgc...');
    await conn.query('ALTER TABLE equipes ADD COLUMN cgc VARCHAR(20) DEFAULT NULL AFTER codigo_erp');
    console.log('✅ Coluna cgc adicionada\n');
    
    console.log('3️⃣ Criando índice para codigo_erp...');
    await conn.query('CREATE INDEX idx_codigo_erp ON equipes(codigo_erp)');
    console.log('✅ Índice idx_codigo_erp criado\n');
    
    console.log('4️⃣ Criando índice para cgc...');
    await conn.query('CREATE INDEX idx_cgc ON equipes(cgc)');
    console.log('✅ Índice idx_cgc criado\n');
    
    console.log('✅ Migration concluída com sucesso!\n');
    
    // Verificar estrutura da tabela
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nexus_b2b' 
      AND TABLE_NAME = 'equipes'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Estrutura da tabela equipes:');
    console.log(''.padEnd(100, '='));
    columns.forEach(col => {
      const maxLen = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      console.log(`  ${col.COLUMN_NAME.padEnd(25)} ${(col.DATA_TYPE + maxLen).padEnd(20)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log(''.padEnd(100, '='));
    
  } catch (error) {
    console.error('❌ Erro na migration:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

runMigration().catch(console.error);
