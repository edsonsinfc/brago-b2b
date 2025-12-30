const pool = require('../src/config/db.mysql');

async function testarCampoEmail() {
  try {
    console.log('🔍 Testando campo recebe_email_notificacao...\n');
    
    // Verificar se a coluna existe
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nexus_b2b' 
        AND TABLE_NAME = 'usuarios' 
        AND COLUMN_NAME = 'recebe_email_notificacao'
    `);
    
    if (columns.length === 0) {
      console.log('❌ Coluna recebe_email_notificacao NÃO existe!');
      return;
    }
    
    console.log('✅ Coluna existe:');
    console.log('   Tipo:', columns[0].DATA_TYPE);
    console.log('   Default:', columns[0].COLUMN_DEFAULT);
    console.log('   Nullable:', columns[0].IS_NULLABLE);
    console.log('');
    
    // Buscar alguns usuários
    const [usuarios] = await pool.execute(`
      SELECT id, nome, email, perfil, recebe_email_notificacao
      FROM usuarios
      LIMIT 5
    `);
    
    console.log('📋 Usuários (primeiros 5):');
    console.log('═'.repeat(80));
    usuarios.forEach(u => {
      console.log(`   ID: ${u.id} | ${u.nome}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Perfil: ${u.perfil}`);
      console.log(`   Recebe Email: ${u.recebe_email_notificacao ? 'SIM ✅' : 'NÃO ❌'}`);
      console.log('   ' + '-'.repeat(76));
    });
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testarCampoEmail();
