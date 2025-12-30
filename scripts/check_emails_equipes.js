const db = require('../src/config/db.mysql');

async function atualizarEmails() {
  const connection = await db.getConnection();
  
  try {
    // Pedir novo email ao usuário
    console.log('📧 Atualizando emails das equipes...\n');
    console.log('Email atual: edson.silva@bragodistribuidora.com.br');
    console.log('⚠️  Este domínio não existe!\n');
    
    // Por enquanto, vou apenas mostrar as equipes
    const [equipes] = await connection.query(
      'SELECT id, nome, vendedor_email FROM equipes WHERE vendedor_email IS NOT NULL'
    );
    
    console.log('🏢 Equipes com email cadastrado:');
    console.table(equipes);
    
    console.log('\n💡 Para atualizar, use este comando SQL:');
    console.log('UPDATE equipes SET vendedor_email = "SEU_EMAIL_VALIDO@GMAIL.COM" WHERE id IN (1,2,3,4,5);');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

atualizarEmails();
