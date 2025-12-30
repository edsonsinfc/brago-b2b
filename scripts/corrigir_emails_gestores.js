require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function corrigirEmails() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔧 CORRIGINDO EMAILS INVÁLIDOS\n');
    
    await conn.beginTransaction();
    
    // 1. Atualizar email do admin (ID 1) - admin@local -> email válido
    console.log('1️⃣ Atualizando admin@local...');
    await conn.execute(
      "UPDATE usuarios SET email = 'admin.brago@bragodistribuidora.com.br' WHERE email = 'admin@local'",
      []
    );
    console.log('   ✅ admin@local → admin.brago@bragodistribuidora.com.br\n');
    
    // 2. Atualizar email do gestor (ID 5) - gestor@teste.com -> email válido
    console.log('2️⃣ Atualizando gestor@teste.com...');
    await conn.execute(
      "UPDATE usuarios SET email = 'gestor.brago@bragodistribuidora.com.br' WHERE email = 'gestor@teste.com'",
      []
    );
    console.log('   ✅ gestor@teste.com → gestor.brago@bragodistribuidora.com.br\n');
    
    await conn.commit();
    
    console.log('✅ EMAILS CORRIGIDOS COM SUCESSO!\n');
    
    // Verificar resultado
    console.log('📊 VERIFICANDO RESULTADO:\n');
    const [users] = await conn.execute(
      "SELECT id, nome, email, perfil FROM usuarios WHERE perfil IN ('admin', 'gestor')"
    );
    
    users.forEach(u => {
      console.log(`   ${u.nome}: ${u.email}`);
    });
    
    console.log('\n🎉 Agora os emails de pedidos pendentes serão enviados para edson.silva@bragodistribuidora.com.br');
    
    process.exit(0);
  } catch (error) {
    await conn.rollback();
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    conn.release();
  }
}

corrigirEmails();
