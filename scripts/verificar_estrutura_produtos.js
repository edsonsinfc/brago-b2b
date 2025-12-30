// Verificar estrutura da tabela produtos
const pool = require('../src/config/db.mysql');

async function verificarEstrutura() {
  console.log('🔍 Verificando estrutura da tabela produtos...\n');
  
  try {
    const [columns] = await pool.execute('DESCRIBE produtos');
    
    console.log('📋 Colunas da tabela produtos:\n');
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'NO' ? '(obrigatório)' : '(opcional)'}`);
    });
    
    console.log('\n📊 Buscando 5 produtos de exemplo:\n');
    const [produtos] = await pool.execute('SELECT * FROM produtos LIMIT 5');
    
    if (produtos.length > 0) {
      console.log('Campos disponíveis:', Object.keys(produtos[0]).join(', '));
      console.log('\nPrimeiro produto:');
      console.log(JSON.stringify(produtos[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

verificarEstrutura();
