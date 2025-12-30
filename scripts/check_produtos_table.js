const mysql = require('mysql2/promise');

async function checkProdutos() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'produtos'");
    console.log('Tabelas encontradas:', tables.length);
    
    if (tables.length > 0) {
      const [desc] = await pool.query('DESCRIBE produtos');
      console.log('\n✅ Estrutura da tabela produtos:');
      desc.forEach(c => console.log(`  ${c.Field} - ${c.Type}`));
    } else {
      console.log('\n⚠️ Tabela produtos não existe! Criando...');
      
      // Criar tabela produtos
      await pool.query(`
        CREATE TABLE produtos (
          id INT PRIMARY KEY AUTO_INCREMENT,
          codprod VARCHAR(20) NOT NULL UNIQUE,
          descricao VARCHAR(255) NOT NULL,
          unidade VARCHAR(10) NOT NULL DEFAULT 'UN',
          multiplos INT NOT NULL DEFAULT 1,
          estoque DECIMAL(10,3) NOT NULL DEFAULT 0,
          preco DECIMAL(10,2) NOT NULL DEFAULT 0,
          ncm VARCHAR(10),
          categoria VARCHAR(50),
          ativo BOOLEAN DEFAULT true,
          foto VARCHAR(500),
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tabela produtos criada!');
      
      // Inserir dados de exemplo
      await pool.query(`
        INSERT INTO produtos (codprod, descricao, unidade, multiplos, estoque, preco, ncm, categoria, foto) VALUES
        ('LMP001', 'Detergente Neutro 5L', 'UN', 6, 120.000, 15.90, '3402.20.00', 'limpeza', 'https://via.placeholder.com/300x300?text=Detergente'),
        ('LMP002', 'Desinfetante Pinho Sol 2L', 'UN', 12, 200.000, 8.50, '3402.20.00', 'limpeza', 'https://via.placeholder.com/300x300?text=Desinfetante'),
        ('HIG001', 'Papel Higiênico 64 rolos', 'FD', 5, 50.000, 45.00, '4818.10.00', 'higiene', 'https://via.placeholder.com/300x300?text=Papel+Higienico')
      `);
      
      console.log('✅ Produtos de exemplo inseridos!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkProdutos();
