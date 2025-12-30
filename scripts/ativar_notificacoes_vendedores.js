const pool = require('../src/config/db.mysql');

async function ativarVendedores() {
  try {
    console.log('🔧 Ativando notificações para vendedores...\n');
    
    const [result] = await pool.execute(`
      UPDATE usuarios 
      SET recebe_email_notificacao = 1 
      WHERE perfil = 'vendedor' AND ativo = 1
    `);
    
    console.log(`✅ ${result.affectedRows} vendedor(es) atualizado(s)\n`);
    
    // Mostrar quem está recebendo
    const [usuarios] = await pool.execute(`
      SELECT id, nome, email, perfil, recebe_email_notificacao
      FROM usuarios
      WHERE recebe_email_notificacao = 1
      ORDER BY perfil, nome
    `);
    
    console.log('📋 Usuários recebendo notificações:');
    console.log('═'.repeat(80));
    usuarios.forEach(u => {
      console.log(`   ${u.id.toString().padEnd(4)} | ${u.nome.padEnd(30)} | ${u.email.padEnd(35)} | ${u.perfil}`);
    });
    console.log('═'.repeat(80));
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

ativarVendedores();
