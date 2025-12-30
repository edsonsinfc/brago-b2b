const pool = require('../src/config/db.mysql');

async function addRecebeEmailNotificacao() {
  try {
    console.log('📧 Adicionando campo recebe_email_notificacao na tabela usuarios...');
    
    // Verificar se a coluna já existe
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'nexus_b2b' 
        AND TABLE_NAME = 'usuarios' 
        AND COLUMN_NAME = 'recebe_email_notificacao'
    `);
    
    if (columns.length > 0) {
      console.log('⚠️  Campo recebe_email_notificacao já existe!');
    } else {
      await pool.execute(`
        ALTER TABLE usuarios 
        ADD COLUMN recebe_email_notificacao BOOLEAN DEFAULT false 
        COMMENT 'Indica se o usuário recebe notificações por email'
      `);
      
      console.log('✅ Campo recebe_email_notificacao adicionado!');
      
      // Ativar notificações para vendedores por padrão
      await pool.execute(`
        UPDATE usuarios 
        SET recebe_email_notificacao = true 
        WHERE perfil = 'vendedor' AND ativo = true
      `);
      
      console.log('✅ Notificações ativadas para vendedores ativos!');
    }
    
    // Exibir usuários que recebem notificações
    const [usuarios] = await pool.execute(`
      SELECT id, nome, email, perfil, recebe_email_notificacao
      FROM usuarios
      WHERE recebe_email_notificacao = true
      ORDER BY perfil, nome
    `);
    
    console.log('\n📋 Usuários que recebem notificações por email:');
    console.log('═'.repeat(80));
    usuarios.forEach(u => {
      console.log(`   ${u.id.toString().padEnd(4)} | ${u.nome.padEnd(30)} | ${u.email.padEnd(35)} | ${u.perfil}`);
    });
    console.log('═'.repeat(80));
    console.log(`   Total: ${usuarios.length} usuário(s)\n`);
    
    await pool.end();
    console.log('✅ Concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

addRecebeEmailNotificacao();
