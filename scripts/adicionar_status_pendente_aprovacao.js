const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nexus_b2b'
});

async function adicionarStatusPendenteAprovacao() {
  try {
    console.log('🔄 Adicionando PENDENTE_APROVACAO ao ENUM de status...\n');
    
    await pool.execute(`
      ALTER TABLE pedidos 
      MODIFY COLUMN status ENUM(
        'AGUARDANDO', 
        'APROVADO', 
        'PENDENTE_APROVACAO', 
        'EM_SEPARACAO', 
        'EM_TRANSPORTE', 
        'SAIU_ENTREGA', 
        'ENTREGUE', 
        'ENVIADO', 
        'CANCELADO'
      ) DEFAULT 'AGUARDANDO'
    `);
    
    console.log('✅ Status PENDENTE_APROVACAO adicionado com sucesso!');
    console.log('\nStatus disponíveis:');
    console.log('  - AGUARDANDO');
    console.log('  - APROVADO');
    console.log('  - PENDENTE_APROVACAO ✨ (novo)');
    console.log('  - EM_SEPARACAO');
    console.log('  - EM_TRANSPORTE');
    console.log('  - SAIU_ENTREGA');
    console.log('  - ENTREGUE');
    console.log('  - ENVIADO');
    console.log('  - CANCELADO\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

adicionarStatusPendenteAprovacao();
