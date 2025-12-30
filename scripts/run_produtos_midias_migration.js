const mysql = require('mysql2/promise');

async function runMigration() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('🔄 Iniciando migration de mídias de produtos...\n');
    
    // Criar tabela produtos_imagens
    console.log('📋 Criando tabela produtos_imagens...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos_imagens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        produto_id INT NOT NULL,
        url VARCHAR(500) NOT NULL,
        ordem INT NOT NULL DEFAULT 0,
        principal BOOLEAN DEFAULT false,
        legenda VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
        INDEX idx_produto_ordem (produto_id, ordem),
        INDEX idx_principal (produto_id, principal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Criar tabela produtos_videos
    console.log('� Criando tabela produtos_videos...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos_videos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        produto_id INT NOT NULL,
        url VARCHAR(500) NOT NULL,
        tipo ENUM('youtube', 'vimeo', 'url_direta') DEFAULT 'youtube',
        ordem INT NOT NULL DEFAULT 0,
        titulo VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
        INDEX idx_produto_ordem (produto_id, ordem)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Criar tabela produtos_especificacoes
    console.log('📋 Criando tabela produtos_especificacoes...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos_especificacoes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        produto_id INT NOT NULL,
        atributo VARCHAR(100) NOT NULL,
        valor TEXT NOT NULL,
        ordem INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
        INDEX idx_produto_ordem (produto_id, ordem)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('\n📸 Inserindo imagens de exemplo...');
    // Imagens do produto LMP001
    await pool.query(`
      INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda) 
      SELECT id, 'https://via.placeholder.com/800x800?text=Detergente+Frente', 1, true, 'Vista frontal'
      FROM produtos WHERE codprod = 'LMP001' LIMIT 1
    `);
    
    await pool.query(`
      INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda)
      SELECT id, 'https://via.placeholder.com/800x800?text=Detergente+Verso', 2, false, 'Vista traseira com informações'
      FROM produtos WHERE codprod = 'LMP001' LIMIT 1
    `);
    
    await pool.query(`
      INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda)
      SELECT id, 'https://via.placeholder.com/800x800?text=Detergente+Uso', 3, false, 'Produto em uso'
      FROM produtos WHERE codprod = 'LMP001' LIMIT 1
    `);
    
    // Imagens do produto HIG001
    await pool.query(`
      INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda)
      SELECT id, 'https://via.placeholder.com/800x800?text=Papel+Higienico+Principal', 1, true, 'Fardo completo'
      FROM produtos WHERE codprod = 'HIG001' LIMIT 1
    `);
    
    await pool.query(`
      INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda)
      SELECT id, 'https://via.placeholder.com/800x800?text=Papel+Higienico+Detalhe', 2, false, 'Detalhe da textura'
      FROM produtos WHERE codprod = 'HIG001' LIMIT 1
    `);
    
    console.log('🎬 Inserindo vídeos de exemplo...');
    await pool.query(`
      INSERT INTO produtos_videos (produto_id, url, tipo, ordem, titulo)
      SELECT id, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 1, 'Como usar o produto corretamente'
      FROM produtos WHERE codprod = 'LMP001' LIMIT 1
    `);
    
    console.log('📄 Inserindo especificações técnicas...');
    // Especificações LMP001
    const specs_lmp001 = [
      ['Composição', 'Tensoativo aniônico, coadjuvantes, conservantes', 1],
      ['Volume', '5 litros', 2],
      ['Peso', '5.2 kg', 3],
      ['Dimensões', '25cm x 18cm x 30cm', 4],
      ['pH', '7.0 (neutro)', 5],
      ['Validade', '24 meses', 6],
      ['Registro Anvisa', '123456789', 7]
    ];
    
    for (const [atributo, valor, ordem] of specs_lmp001) {
      await pool.query(`
        INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
        SELECT id, ?, ?, ?
        FROM produtos WHERE codprod = 'LMP001' LIMIT 1
      `, [atributo, valor, ordem]);
    }
    
    // Especificações HIG001
    const specs_hig001 = [
      ['Quantidade de rolos', '64 rolos', 1],
      ['Folhas por rolo', '30 metros', 2],
      ['Folhas', 'Duplas (2 camadas)', 3],
      ['Cor', 'Branco', 4],
      ['Material', '100% celulose virgem', 5]
    ];
    
    for (const [atributo, valor, ordem] of specs_hig001) {
      await pool.query(`
        INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
        SELECT id, ?, ?, ?
        FROM produtos WHERE codprod = 'HIG001' LIMIT 1
      `, [atributo, valor, ordem]);
    }
    
    console.log('\n✅ Migration executada com sucesso!\n');
    
    // Mostrar estatísticas
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM produtos_imagens) as total_imagens,
        (SELECT COUNT(*) FROM produtos_videos) as total_videos,
        (SELECT COUNT(*) FROM produtos_especificacoes) as total_especificacoes
    `);
    
    console.log('📊 Estatísticas:');
    console.log(`   - Imagens: ${stats[0].total_imagens}`);
    console.log(`   - Vídeos: ${stats[0].total_videos}`);
    console.log(`   - Especificações: ${stats[0].total_especificacoes}`);
    
  } catch (error) {
    console.error('❌ Erro na migration:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
