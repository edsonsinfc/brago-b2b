const db = require('../src/config/db.mysql');

(async () => {
  try {
    console.log('🔄 Renomeando coluna cont_obri para cont_oba...');
    
    await db.query(`
      ALTER TABLE produtos 
      CHANGE COLUMN cont_obri cont_oba CHAR(1) DEFAULT 'N'
    `);
    
    console.log('✅ Coluna renomeada com sucesso!');
    console.log('   cont_obri → cont_oba');
    
    // Verificar
    const [cols] = await db.query("SHOW COLUMNS FROM produtos WHERE Field = 'cont_oba'");
    if (cols.length > 0) {
      console.log(`\n✅ Confirmado: coluna cont_oba existe no banco!`);
    }
    
    await db.end();
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
})();
