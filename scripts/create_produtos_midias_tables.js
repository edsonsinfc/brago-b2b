const pool = require('../src/config/db.mysql');

async function criarTabelasProdutosMidias() {
  try {
    console.log('📦 Criando tabelas de mídias de produtos...');
    
    // Criar tabela produtos_imagens
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS produtos_imagens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        produto_id INT NOT NULL,
        url VARCHAR(500) NOT NULL,
        legenda VARCHAR(200),
        principal BOOLEAN DEFAULT FALSE,
        ordem INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
        INDEX idx_produto_id (produto_id),
        INDEX idx_principal (principal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela produtos_imagens criada');
    
    // Criar tabela produtos_videos
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS produtos_videos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        produto_id INT NOT NULL,
        url VARCHAR(500) NOT NULL,
        titulo VARCHAR(200),
        tipo ENUM('youtube', 'vimeo', 'arquivo') DEFAULT 'youtube',
        ordem INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
        INDEX idx_produto_id (produto_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela produtos_videos criada');
    
    // Criar tabela produtos_especificacoes
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS produtos_especificacoes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        produto_id INT NOT NULL,
        nome VARCHAR(100) NOT NULL,
        valor TEXT NOT NULL,
        ordem INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
        INDEX idx_produto_id (produto_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela produtos_especificacoes criada');
    
    console.log('🎉 Todas as tabelas de mídias foram criadas com sucesso!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    process.exit(1);
  }
}

criarTabelasProdutosMidias();
