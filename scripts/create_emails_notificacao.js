const pool = require('../src/config/db.mysql');

async function createEmailsNotificacao() {
  try {
    console.log('📧 Criando tabela emails_notificacao...');
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS emails_notificacao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        nome VARCHAR(255) NOT NULL,
        tipo ENUM('pedido_aprovado', 'pedido_rejeitado', 'todos') DEFAULT 'todos',
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ativo (ativo),
        INDEX idx_tipo (tipo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabela criada!');
    
    // Inserir email do Brenan como padrão
    console.log('📧 Inserindo email padrão do Brenan...');
    
    await pool.execute(`
      INSERT IGNORE INTO emails_notificacao (email, nome, tipo, ativo)
      VALUES ('brenan.araujo@edebex.com.br', 'Brenan Araújo', 'todos', true)
    `);
    
    console.log('✅ Email padrão inserido!');
    
    // Verificar emails cadastrados
    const [emails] = await pool.execute('SELECT * FROM emails_notificacao');
    console.log('\n📋 Emails cadastrados:', emails);
    
    console.log('\n✅ Processo concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createEmailsNotificacao();
