const pool = require('../src/config/db.mysql');

async function runMigration() {
  console.log('🔄 Executando migração: Adicionar codigo_erp e cgc em pedidos...\n');
  
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Verificar colunas existentes
    const [columns] = await conn.query('DESCRIBE pedidos');
    const existingColumns = columns.map(col => col.Field);
    
    console.log('📋 Colunas existentes:', existingColumns.filter(c => c === 'codigo_erp' || c === 'cgc'));
    console.log('');
    
    // Adicionar codigo_erp se não existir
    if (!existingColumns.includes('codigo_erp')) {
      console.log('1️⃣ Adicionando coluna codigo_erp...');
      await conn.query('ALTER TABLE pedidos ADD COLUMN codigo_erp VARCHAR(50) NULL COMMENT "Código do cliente no ERP"');
      console.log('  ✅ Coluna codigo_erp adicionada\n');
    } else {
      console.log('⏭️  Coluna codigo_erp já existe\n');
    }
    
    // Adicionar cgc se não existir
    if (!existingColumns.includes('cgc')) {
      console.log('2️⃣ Adicionando coluna cgc...');
      await conn.query('ALTER TABLE pedidos ADD COLUMN cgc VARCHAR(20) NULL COMMENT "CGC/CNPJ do cliente"');
      console.log('  ✅ Coluna cgc adicionada\n');
    } else {
      console.log('⏭️  Coluna cgc já existe\n');
    }
    
    // Criar índice codigo_erp
    try {
      console.log('3️⃣ Criando índice para codigo_erp...');
      await conn.query('CREATE INDEX idx_pedidos_codigo_erp ON pedidos(codigo_erp)');
      console.log('  ✅ Índice idx_pedidos_codigo_erp criado\n');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ⏭️  Índice idx_pedidos_codigo_erp já existe\n');
      } else {
        throw e;
      }
    }
    
    // Criar índice cgc
    try {
      console.log('4️⃣ Criando índice para cgc...');
      await conn.query('CREATE INDEX idx_pedidos_cgc ON pedidos(cgc)');
      console.log('  ✅ Índice idx_pedidos_cgc criado\n');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ⏭️  Índice idx_pedidos_cgc já existe\n');
      } else {
        throw e;
      }
    }
    
    // Verificar a estrutura final
    console.log('📋 Estrutura final da tabela pedidos:');
    const [finalColumns] = await conn.query('DESCRIBE pedidos');
    
    const relevantColumns = finalColumns.filter(col => 
      col.Field === 'codigo_erp' || col.Field === 'cgc'
    );
    
    relevantColumns.forEach(col => {
      console.log(`  ✅ ${col.Field} (${col.Type})`);
    });
    
    console.log('\n✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    throw error;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

runMigration();
