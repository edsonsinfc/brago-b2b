const db = require('../src/config/db.mysql');

(async () => {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM produtos');
    console.log('\n📋 Colunas da tabela produtos:');
    cols.forEach(c => {
      console.log(`  - ${c.Field} (${c.Type})`);
    });
    
    // Verificar se cont_obri ou cont_oba existe
    const hasCont_obri = cols.find(c => c.Field === 'cont_obri');
    const hasCont_oba = cols.find(c => c.Field === 'cont_oba');
    
    console.log('\n🔍 Verificação:');
    console.log(`  cont_obri existe: ${hasCont_obri ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`  cont_oba existe: ${hasCont_oba ? '✅ SIM' : '❌ NÃO'}`);
    
    await db.end();
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
})();
