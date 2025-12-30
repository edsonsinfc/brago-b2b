require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function updatePerfilEnum() {
  try {
    console.log('🔧 Atualizando ENUM da coluna perfil...');
    
    await pool.execute(`
      ALTER TABLE usuarios 
      MODIFY COLUMN perfil ENUM('admin','gestor','solicitante','vendedor') NOT NULL
    `);
    
    console.log('✅ ENUM atualizado: admin, gestor, solicitante, vendedor');
    
    // Atualizar registros que tinham 'equipe' para 'solicitante'
    const [result] = await pool.execute(`
      UPDATE usuarios 
      SET perfil = 'solicitante' 
      WHERE id = 3
    `);
    
    console.log(`✅ ${result.affectedRows} usuário(s) atualizado(s) para solicitante`);
    
    // Verificar
    const [rows] = await pool.execute('SELECT id, nome, perfil, categoria_acesso FROM usuarios WHERE id = 3');
    console.log('\n📋 Usuário Kamila:');
    console.log(rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

updatePerfilEnum();
