require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function addRastreamentoFields() {
  try {
    console.log('🚀 Adicionando campos de rastreamento...\n');
    
    // Verificar e adicionar cada campo individualmente
    const fields = [
      { name: 'data_confirmacao', type: 'DATETIME DEFAULT NULL' },
      { name: 'data_separacao', type: 'DATETIME DEFAULT NULL' },
      { name: 'data_transporte', type: 'DATETIME DEFAULT NULL' },
      { name: 'data_saida', type: 'DATETIME DEFAULT NULL' },
      { name: 'data_entrega', type: 'DATETIME DEFAULT NULL' },
      { name: 'observacoes_rastreamento', type: 'TEXT DEFAULT NULL' }
    ];
    
    for (const field of fields) {
      try {
        await pool.execute(`ALTER TABLE pedidos ADD COLUMN ${field.name} ${field.type}`);
        console.log(`✅ Campo ${field.name} adicionado`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Campo ${field.name} já existe`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Todos os campos verificados\n');
    
    // Atualizar pedidos existentes
    await pool.execute('UPDATE pedidos SET data_confirmacao = data WHERE data_confirmacao IS NULL');
    console.log('✅ Pedidos existentes atualizados com data_confirmacao\n');
    
    console.log('🎉 Migration concluída com sucesso!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migration:', error.message);
    process.exit(1);
  }
}

addRastreamentoFields();
