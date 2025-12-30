require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function atualizarEmailsEquipes() {
  try {
    console.log('📧 Atualizando emails das equipes...\n');
    
    // Atualizar todas as equipes para usar seu email
    await pool.execute(`
      UPDATE equipes 
      SET vendedor_email = ? 
      WHERE vendedor_email IS NULL OR vendedor_email = 'vendedor@empresa.com'
    `, ['edson.silva@bragodistribuidora.com.br']);
    
    // Mostrar resultado
    const [equipes] = await pool.execute('SELECT id, nome, vendedor_email FROM equipes');
    
    console.log('✅ Emails atualizados:\n');
    equipes.forEach(eq => {
      console.log(`   ${eq.id}. ${eq.nome}`);
      console.log(`      📧 ${eq.vendedor_email || '❌ SEM EMAIL'}\n`);
    });
    
    console.log('🎯 Agora todos os pedidos serão enviados para: edson.silva@bragodistribuidora.com.br');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

atualizarEmailsEquipes();
