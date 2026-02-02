const db = require('../src/config/db.mysql');

(async () => {
  try {
    console.log('\n🔧 Criando estrutura para produtos com acesso específico por equipe...\n');
    
    // 1. Verificar se a tabela produtos_equipes_especificas existe
    console.log('📋 Verificando tabela produtos_equipes_especificas...');
    const [tables] = await db.query(`
      SHOW TABLES LIKE 'produtos_equipes_especificas'
    `);
    
    if (tables.length === 0) {
      console.log('   ⚙️ Criando tabela produtos_equipes_especificas...');
      await db.query(`
        CREATE TABLE produtos_equipes_especificas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          produto_id INT NOT NULL,
          equipe_id INT NOT NULL,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
          FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
          UNIQUE KEY unique_produto_equipe (produto_id, equipe_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ Tabela produtos_equipes_especificas criada com sucesso!');
    } else {
      console.log('   ✅ Tabela produtos_equipes_especificas já existe');
    }
    
    // 2. Adicionar campo acesso_especifico na tabela produtos
    console.log('\n📋 Verificando campo acesso_especifico na tabela produtos...');
    const [columns] = await db.query(`
      SHOW COLUMNS FROM produtos LIKE 'acesso_especifico'
    `);
    
    if (columns.length === 0) {
      console.log('   ⚙️ Adicionando campo acesso_especifico...');
      await db.query(`
        ALTER TABLE produtos 
        ADD COLUMN acesso_especifico TINYINT(1) DEFAULT 0 
        COMMENT '0=Todas equipes, 1=Equipes específicas'
        AFTER cont_oba
      `);
      console.log('   ✅ Campo acesso_especifico adicionado com sucesso!');
    } else {
      console.log('   ✅ Campo acesso_especifico já existe');
    }
    
    // 3. Adicionar campo foto_path para upload de imagens
    console.log('\n📋 Verificando campo foto_path na tabela produtos...');
    const [fotoColumns] = await db.query(`
      SHOW COLUMNS FROM produtos LIKE 'foto_path'
    `);
    
    if (fotoColumns.length === 0) {
      console.log('   ⚙️ Adicionando campo foto_path...');
      await db.query(`
        ALTER TABLE produtos 
        ADD COLUMN foto_path VARCHAR(500) DEFAULT NULL 
        COMMENT 'Caminho da foto enviada via upload'
        AFTER foto
      `);
      console.log('   ✅ Campo foto_path adicionado com sucesso!');
    } else {
      console.log('   ✅ Campo foto_path já existe');
    }
    
    // 4. Verificar produtos atuais
    console.log('\n📊 Resumo da estrutura atual:');
    const [produtosCount] = await db.query(`SELECT COUNT(*) as total FROM produtos`);
    console.log(`   📦 Total de produtos: ${produtosCount[0].total}`);
    
    const [produtosEspecificos] = await db.query(`
      SELECT COUNT(*) as total FROM produtos WHERE acesso_especifico = 1
    `);
    console.log(`   🔒 Produtos com acesso específico: ${produtosEspecificos[0].total}`);
    
    const [produtosLivres] = await db.query(`
      SELECT COUNT(*) as total FROM produtos WHERE acesso_especifico = 0
    `);
    console.log(`   🌍 Produtos disponíveis para todos: ${produtosLivres[0].total}`);
    
    console.log('\n✅ Estrutura criada com sucesso!');
    console.log('\n💡 Como funciona:');
    console.log('   • acesso_especifico = 0: Produto disponível para TODAS as equipes');
    console.log('   • acesso_especifico = 1: Produto disponível apenas para equipes específicas');
    console.log('   • Equipes específicas são definidas na tabela produtos_equipes_especificas');
    console.log('   • foto_path: Armazena o caminho da foto enviada via upload\n');
    
    await db.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await db.end();
    process.exit(1);
  }
})();
