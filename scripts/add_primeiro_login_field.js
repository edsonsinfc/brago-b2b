const pool = require('../src/config/db.mysql');

async function addPrimeiroLoginField() {
  try {
    console.log('\n🔧 ADICIONANDO CAMPO DE PRIMEIRO LOGIN\n');
    console.log('='.repeat(80));
    
    // Adicionar coluna primeiro_login (TINYINT - 1 = precisa trocar senha, 0 = já trocou)
    await pool.execute(`
      ALTER TABLE usuarios 
      ADD COLUMN primeiro_login TINYINT(1) DEFAULT 1 
      COMMENT 'Indica se usuário precisa trocar senha no primeiro login'
    `);
    
    console.log('✅ Coluna "primeiro_login" adicionada à tabela usuarios');
    
    // Marcar todos usuários atuais como primeiro_login = 1 (exceto admin)
    const [result] = await pool.execute(`
      UPDATE usuarios 
      SET primeiro_login = 1 
      WHERE perfil != 'admin'
    `);
    
    console.log(`✅ ${result.affectedRows} usuários marcados para trocar senha no primeiro login`);
    
    // Admin não precisa trocar senha
    await pool.execute(`
      UPDATE usuarios 
      SET primeiro_login = 0 
      WHERE perfil = 'admin'
    `);
    
    console.log('✅ Usuários admin mantidos sem obrigatoriedade');
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ CAMPO ADICIONADO COM SUCESSO!\n');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('\nℹ️  Campo "primeiro_login" já existe na tabela\n');
      process.exit(0);
    }
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  }
}

addPrimeiroLoginField();
