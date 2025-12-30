const db = require('../src/config/db.mysql');

async function checkEquipesStructure() {
  const connection = await db.getConnection();
  
  try {
    console.log('📋 Estrutura da tabela EQUIPES:\n');
    
    const [columns] = await connection.query('DESCRIBE equipes');
    
    console.table(columns);
    
    console.log('\n📊 Dados das equipes:\n');
    const [equipes] = await connection.query('SELECT * FROM equipes');
    console.table(equipes);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkEquipesStructure();
