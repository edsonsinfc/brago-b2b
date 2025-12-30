// Script para criar tabela equipe_produtos
const pool = require('../src/config/db.mysql');
const fs = require('fs');

async function criarTabela() {
  console.log('🔧 Criando tabela equipe_produtos...\n');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS equipe_produtos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      equipe_id INT NOT NULL,
      produto_id INT NOT NULL,
      data_atribuicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atribuido_por INT NULL COMMENT 'ID do usuário admin/gestor que atribuiu',
      
      FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
      FOREIGN KEY (atribuido_por) REFERENCES usuarios(id) ON DELETE SET NULL,
      
      UNIQUE KEY unique_equipe_produto (equipe_id, produto_id),
      
      INDEX idx_equipe (equipe_id),
      INDEX idx_produto (produto_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  try {
    await pool.execute(sql);
    console.log('✅ Tabela equipe_produtos criada com sucesso!');
    
    // Verificar se foi criada
    const [tables] = await pool.execute("SHOW TABLES LIKE 'equipe_produtos'");
    console.log('✅ Verificação:', tables.length > 0 ? 'Tabela existe' : 'Tabela não encontrada');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

criarTabela();
