const mysql = require('mysql2/promise');

async function addLimiteCredito() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('🔄 Adicionando campos de limite de crédito...');

    // Verificar se as colunas já existem
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nexus_b2b' 
        AND TABLE_NAME = 'equipes' 
        AND COLUMN_NAME IN ('limite_credito', 'limite_disponivel')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    // Adicionar limite_credito se não existir
    if (!existingColumns.includes('limite_credito')) {
      await connection.execute(`
        ALTER TABLE equipes 
        ADD COLUMN limite_credito DECIMAL(10,2) DEFAULT 10000.00 
        COMMENT 'Limite total de crédito da equipe'
      `);
      console.log('✅ Campo limite_credito adicionado');
    } else {
      console.log('ℹ️  Campo limite_credito já existe');
    }

    // Adicionar limite_disponivel se não existir
    if (!existingColumns.includes('limite_disponivel')) {
      await connection.execute(`
        ALTER TABLE equipes 
        ADD COLUMN limite_disponivel DECIMAL(10,2) DEFAULT 10000.00 
        COMMENT 'Limite disponível para pedidos'
      `);
      console.log('✅ Campo limite_disponivel adicionado');
    } else {
      console.log('ℹ️  Campo limite_disponivel já existe');
    }

    // Atualizar equipes existentes com limite padrão
    await connection.execute(`
      UPDATE equipes 
      SET limite_credito = COALESCE(limite_credito, 10000.00), 
          limite_disponivel = COALESCE(limite_disponivel, 10000.00)
    `);

    console.log('✅ Limites padrão configurados para equipes existentes');

    // Verificar se coluna motivo_pendencia existe
    const [pedidosColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nexus_b2b' 
        AND TABLE_NAME = 'pedidos' 
        AND COLUMN_NAME = 'motivo_pendencia'
    `);

    if (pedidosColumns.length === 0) {
      await connection.execute(`
        ALTER TABLE pedidos 
        ADD COLUMN motivo_pendencia TEXT 
        COMMENT 'Motivo da pendência de aprovação'
      `);
      console.log('✅ Campo motivo_pendencia adicionado à tabela pedidos');
    } else {
      console.log('ℹ️  Campo motivo_pendencia já existe');
    }

    console.log('\n✨ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addLimiteCredito().catch(console.error);
